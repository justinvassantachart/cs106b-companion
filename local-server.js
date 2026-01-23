const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4200;
const DIST_DIR = path.join(__dirname, 'dist/cs106b-companion/browser');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    let filePath = req.url === '/' ? '/index.html' : req.url;

    // Remove query string
    filePath = filePath.split('?')[0];

    // Resolve absolute path
    let absPath = path.join(DIST_DIR, filePath);

    // Security Headers Strategy
    // 1. Default: Strict isolation for SharedArrayBuffer
    let headers = {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cache-Control': 'no-cache' // Disable caching for development
    };

    // 2. Exception: Relaxed for Auth Bridge (matches public/_headers)
    if (req.url.includes('/assets/auth.html')) {
        headers['Cross-Origin-Opener-Policy'] = 'unsafe-none';
        headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none';
    }

    // Try to find file
    fs.stat(absPath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Fallback to index.html (SPA routing)
            absPath = path.join(DIST_DIR, 'index.html');
            // Check if index exists (it should)
            if (!fs.existsSync(absPath)) {
                res.writeHead(404);
                res.end('Not found (and index.html missing within dist)');
                return;
            }
        }

        // Determine content type
        const ext = path.extname(absPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        headers['Content-Type'] = contentType;

        // Serve file
        res.writeHead(200, headers);
        fs.createReadStream(absPath).pipe(res);
    });

}).listen(PORT, () => {
    console.log(`\nLocal Auth Server running at http://localhost:${PORT}`);
    console.log(`- /assets/auth.html serves with Relaxed Headers`);
    console.log(`- All other files serve with Strict Headers (COOP/COEP)`);
    console.log(`\nPress Ctrl+C to stop.`);
});
