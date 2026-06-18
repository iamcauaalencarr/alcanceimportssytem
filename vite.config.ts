import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Custom plugin to handle saving products to local database files
function localBackendPlugin() {
  return {
    name: 'local-backend',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method === 'POST' && req.url === '/api/save-products') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const dataPath = path.resolve(__dirname, 'src/products-data.json');
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Produtos salvos com sucesso!' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.method === 'POST' && req.url === '/api/save-settings') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const dataPath = path.resolve(__dirname, 'src/settings-data.json');
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Configurações salvas com sucesso!' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.method === 'POST' && req.url === '/api/save-contract') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const dataPath = path.resolve(__dirname, 'src/contracts-data.json');
              let contracts = [];
              if (fs.existsSync(dataPath)) {
                try {
                  contracts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                } catch (e) {
                  contracts = [];
                }
              }
              if (!Array.isArray(contracts)) {
                contracts = [];
              }
              contracts.push(data);
              fs.writeFileSync(dataPath, JSON.stringify(contracts, null, 2), 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Contrato salvo com sucesso!' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.method === 'POST' && req.url === '/api/save-all-contracts') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const dataPath = path.resolve(__dirname, 'src/contracts-data.json');
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Contratos salvos com sucesso!' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.method === 'GET' && req.url === '/api/get-contracts') {
          try {
            const dataPath = path.resolve(__dirname, 'src/contracts-data.json');
            let contracts = [];
            if (fs.existsSync(dataPath)) {
              contracts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(contracts));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localBackendPlugin()
  ],
})
