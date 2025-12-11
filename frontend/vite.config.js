import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    https: true, // Enable HTTPS
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
        secure: false,
        changeOrigin: true
      }
    }
  }
})
