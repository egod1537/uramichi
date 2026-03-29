import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEFAULT_PORT = 1111;
const ALLOWED_HOSTS = ['travel.mangagaki.net'];

function resolvePort(rawValue) {
  const port = Number.parseInt(rawValue ?? '', 10);

  return Number.isNaN(port) ? DEFAULT_PORT : port;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = resolvePort(env.PORT);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      strictPort: true,
      allowedHosts: ALLOWED_HOSTS,
    },
    preview: {
      port,
      strictPort: true,
      allowedHosts: ALLOWED_HOSTS,
    },
  };
});
