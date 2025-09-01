const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3018;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'text/plain';
}

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Parse URL and remove query parameters
    let filePath = req.url.split('?')[0];
    
    // Default to index.html for root path
    if (filePath === '/') {
        filePath = '/app.html'; // Use app.html as the main entry point
    }
    
    // Build full file path
    const fullPath = path.join(PUBLIC_DIR, filePath);
    
    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            // Try with .html extension if not found
            const htmlPath = fullPath + '.html';
            fs.access(htmlPath, fs.constants.F_OK, (htmlErr) => {
                if (htmlErr) {
                    // File not found - serve app.html for SPA routing
                    const appPath = path.join(PUBLIC_DIR, 'app.html');
                    fs.readFile(appPath, (appErr, content) => {
                        if (appErr) {
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end('<h1>404 - Page Not Found</h1>');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(content);
                        }
                    });
                } else {
                    // Serve the .html file
                    serveFile(htmlPath, res);
                }
            });
        } else {
            // Serve the requested file
            serveFile(fullPath, res);
        }
    });
});

function serveFile(filePath, res) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Internal Server Error</h1>');
            return;
        }
        
        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(content);
    });
}

// Start server
server.listen(PORT, () => {
    console.log('🔐 CryptoVault Server Starting...');
    console.log('=====================================');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
    console.log('');
    console.log('Available Pages:');
    console.log(`   📊 Main App:      http://localhost:${PORT}/`);
    console.log(`   🏦 Vault Portal:  http://localhost:${PORT}/vault.html`);
    console.log(`   📈 DEX Interface: http://localhost:${PORT}/dex.html`);
    console.log('');
    console.log('Features:');
    console.log('   ✅ Investment with MetaMask integration');
    console.log('   ✅ Donation with MetaMask integration');
    console.log('   ✅ Project creation with MetaMask integration');
    console.log('   ✅ DEX trading with ETH pairs');
    console.log('   ✅ Cross-page navigation');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('=====================================');
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down CryptoVault server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});