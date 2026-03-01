import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    middlewares: [
      // Proxy /klipy/* requests to Klipy API with key injected server-side
      (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/klipy/')) return next();
        
        const apiKey = process.env.VITE_KLIPY_API_KEY || '';
        if (!apiKey) {
          res.statusCode = 400;
          res.end('VITE_KLIPY_API_KEY not set');
          return;
        }
        
        const reqPath = req.url.replace(/^\/klipy/, '');
        const url = `https://api.klipy.com/api/v1/${apiKey}${reqPath}`;
        
        fetch(url)
          .then(async (apiRes) => {
            res.statusCode = apiRes.status;
            apiRes.headers.forEach((v, k) => {
              // Skip headers that shouldn't be forwarded
              if (!['content-encoding', 'transfer-encoding'].includes(k.toLowerCase())) {
                res.setHeader(k, v);
              }
            });
            const buffer = await apiRes.arrayBuffer();
            res.end(Buffer.from(buffer));
          })
          .catch((err: any) => {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
      },
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
