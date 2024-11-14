const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // This is the path you want to proxy
    createProxyMiddleware({
      // target: 'http://api:5001', // The target server - For Docker
      target: 'http://127.0.0.1:5001', // For local testing
      changeOrigin: true,
    })
  );
};