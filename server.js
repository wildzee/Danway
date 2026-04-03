const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const port = parseInt(process.env.PORT || '3131', 10);
const dev = process.env.NODE_ENV !== 'production';

// Use standard Next.js runtime. 
// Electron builder will exclude devDependencies automatically (saving 1.4GB)
// so the standard runtime is fast and reliable.
const dir = dev ? process.cwd() : __dirname; // __dirname resolves correctly to the inside of the .asar archive

const app = next({ dev, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, '127.0.0.1', () => {
        console.log(`> Next.js server ready on http://127.0.0.1:${port}`);
        if (process.send) process.send('ready');
    });
});
