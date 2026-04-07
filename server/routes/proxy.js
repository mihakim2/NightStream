import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

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

    res.set('Content-Type', contentType || 'application/octet-stream');
    response.body.pipe(res);
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
