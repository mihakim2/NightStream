import { Router } from 'express';
import { Readable } from 'stream';
import https from 'https';
import http from 'http';

const router = Router();

// Custom fetch that ignores self-signed SSL certs (common with IPTV providers)
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

async function proxyFetch(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const options = { agent: url.startsWith('https') ? insecureAgent : undefined };
    const req = mod.get(url, options, (res) => {
      // Follow redirects
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && res.headers.location && maxRedirects > 0) {
        res.resume(); // drain the response
        const redirectUrl = new URL(res.headers.location, url).href;
        return proxyFetch(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        headers: { get: (key) => res.headers[key.toLowerCase()] },
        body: res,
        text: () => new Promise((r, j) => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); res.on('error', j); }),
      });
    });
    req.on('error', reject);
  });
}

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await proxyFetch(targetUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || '';

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');

    if (contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8')) {
      const body = await response.text();
      const rewritten = rewriteHlsManifest(body, targetUrl);
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    // Fix content type for TS streams that have wrong content-type
    let finalContentType = contentType || 'application/octet-stream';
    if (targetUrl.endsWith('.ts') && !finalContentType.includes('video')) {
      finalContentType = 'video/mp2t';
    }
    res.set('Content-Type', finalContentType);

    // Pipe the response body to the client
    const reader = response.body;
    if (reader && typeof reader.pipe === 'function') {
      reader.pipe(res);
    } else if (reader && typeof reader.getReader === 'function') {
      // Web ReadableStream (native fetch) - convert to Node stream
      const nodeStream = Readable.fromWeb(reader);
      nodeStream.pipe(res);
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
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
