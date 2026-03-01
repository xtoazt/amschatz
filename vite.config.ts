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
        
        const path = req.url.replace(/^\/klipy/, '');
        const url = `https://api.klipy.com/api/v1/${apiKey}${path}`;
        
        fetch(url).then((apiRes: any) => {
          res.statusCode = apiRes.status;
          apiRes.headers.forEach((v: string, k: string) => res.setHeader(k, v));
          apiRes.body.pipe(res);
        }).catch((err: Error) => {
          res.statusCode = 500;
          res.end(err.message);
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
