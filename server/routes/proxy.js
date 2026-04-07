import { Router } from 'express';
import https from 'https';
import http from 'http';

const router = Router();

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function proxyRequest(url, headers = {}, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers,
      agent: parsed.protocol === 'https:' ? insecureAgent : undefined,
    };
    const req = mod.request(options, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        res.resume();
        let redirectUrl = new URL(res.headers.location, url).href;
        // Xtream Codes CDN sometimes returns wildcard hostnames like *.domain.com
        // Replace * with a working subdomain — try 'vod', as that commonly resolves
        if (redirectUrl.includes('//*')) {
          redirectUrl = redirectUrl.replace('//*.', '//vod.');
        }
        return proxyRequest(redirectUrl, headers, maxRedirects - 1).then(resolve).catch(reject);
      }
      resolve(res);
    });
    req.on('error', reject);
    req.end();
  });
}

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  try {
    // Express already decodes query params, so use url directly
    const targetUrl = url;

    // Forward Range header from browser for seeking support
    const upstreamHeaders = {};
    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range;
    }

    const upstream = await proxyRequest(targetUrl, upstreamHeaders);

    const contentType = upstream.headers['content-type'] || '';

    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');

    // HLS manifest — rewrite and return
    if (contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8')) {
      const body = await new Promise((r, j) => { let d = ''; upstream.on('data', c => d += c); upstream.on('end', () => r(d)); upstream.on('error', j); });
      const rewritten = rewriteHlsManifest(body, targetUrl);
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    // Set content type
    let finalContentType = contentType || 'application/octet-stream';
    if (targetUrl.endsWith('.ts') && !finalContentType.includes('video')) {
      finalContentType = 'video/mp2t';
    }
    res.set('Content-Type', finalContentType);

    // Forward range-related headers for seeking
    if (upstream.headers['content-length']) {
      res.set('Content-Length', upstream.headers['content-length']);
    }
    if (upstream.headers['content-range']) {
      res.set('Content-Range', upstream.headers['content-range']);
    }
    if (upstream.headers['accept-ranges']) {
      res.set('Accept-Ranges', upstream.headers['accept-ranges']);
    } else {
      res.set('Accept-Ranges', 'bytes');
    }

    // Use 206 if upstream returned partial content
    res.status(upstream.statusCode);

    upstream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function rewriteHlsManifest(manifest, manifestUrl) {
  const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);

  return manifest.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
          const absoluteUri = uri.startsWith('http') ? uri : baseUrl + uri;
          return `URI="/api/proxy/stream?url=${encodeURIComponent(absoluteUri)}"`;
        });
      }
      return line;
    }
    const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
    return `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
  }).join('\n');
}

export default router;
