const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api', // This is the path you want to proxy
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000', // The target server
      changeOrigin: true,
    })
  );
};