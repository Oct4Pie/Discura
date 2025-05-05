import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// Fix path import with proper import syntax
import * as path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

// Custom request logger plugin for Vite
function requestLoggerPlugin(): Plugin {
  return {
    name: 'vite-plugin-request-logger',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
        const start = Date.now()
        
        // Store the original end method
        const originalEnd = res.end
        
        // Fix the typing of the res.end method to match ServerResponse expectations
        res.end = function(
          chunk?: any, 
          encodingOrCallback?: string | (() => void),
          callback?: () => void
        ): ServerResponse {
          const duration = Date.now() - start
          const statusCode = res.statusCode
          
          // Log request details (using Vite's built-in logging colors)
          const method = req.method || 'UNKNOWN'
          const url = req.url || 'UNKNOWN'
          
          // Format using Vite's color scheme
          console.log(
            `\x1b[32m[vite]\x1b[0m \x1b[90m${method}\x1b[0m \x1b[36m${url}\x1b[0m \x1b[${statusCode >= 400 ? '31' : '32'}m${statusCode}\x1b[0m \x1b[90m${duration}ms\x1b[0m`
          )
          
          // Call the original end method with proper parameters
          return originalEnd.call(this, chunk, encodingOrCallback, callback);
        }
        
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    requestLoggerPlugin(),
  ],
  resolve: {
    alias: [
      {
        find: 'common',
        replacement: path.resolve(__dirname, '../common')
      }
    ]
  },
  server: {
    proxy: {
      // Proxy /api requests to the backend server, removing the /api prefix
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
