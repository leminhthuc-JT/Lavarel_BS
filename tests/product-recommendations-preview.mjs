// Local preview of the actual rendered Blade + shipped assets, with read-only MongoDB snapshots.
// Usage: node tests/product-recommendations-preview.mjs <snapshot-directory>
// This never bypasses Laravel auth: it runs a separate loopback-only static preview server.
import { createServer } from 'node:http';
import { readFileSync, createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const directory = resolve(process.argv[2]);
const root = resolve('public');
const snapshots = JSON.parse(readFileSync(resolve(directory, 'snapshots.json'), 'utf8'));
const types = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
let scenario = 'normal';
createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1:8127');
    response.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/__qa/scenario') {
        scenario = url.searchParams.get('value') || 'normal'; response.end('ok'); return;
    }
    if (url.pathname === '/api/admin/product-recommendations') {
        response.setHeader('Content-Type', 'application/json');
        const mode = url.searchParams.get('mode') || 'real';
        if (scenario === 'error') { response.writeHead(503); response.end(JSON.stringify({success:false,message:'Không thể đọc dữ liệu gợi ý từ MongoDB. Vui lòng thử lại.'})); return; }
        const payload = structuredClone(snapshots[mode]);
        if (scenario === 'empty') { payload.data.items = []; payload.data.analyzedProducts = 0; payload.data.validOrders = 0; }
        setTimeout(() => response.end(JSON.stringify(payload)), 350); return;
    }
    if (url.pathname === '/admin/product-recommendations' || url.pathname === '/') {
        response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(readFileSync(resolve(directory, 'page.html'))); return;
    }
    try {
        const file = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (!file.startsWith(root + sep) || !statSync(file).isFile()) throw new Error('not found');
        response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
        createReadStream(file).pipe(response);
    } catch { response.writeHead(404); response.end('Not found'); }
}).listen(8127, '127.0.0.1', () => console.log('Preview ready at http://127.0.0.1:8127/admin/product-recommendations'));
