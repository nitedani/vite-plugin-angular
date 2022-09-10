import { defineConfig } from 'vite';
import { vpa } from '@nitedani/vite-plugin-angular';

export default defineConfig({
  plugins: [vpa()],
});
