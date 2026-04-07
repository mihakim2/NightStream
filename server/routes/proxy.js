import { Router } from 'express';
import { Readable } from 'stream';

const router = Router();

router.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url parameter required' });

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl);

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
