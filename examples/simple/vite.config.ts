import { defineConfig } from 'vite';
import { angular } from '@vikejs/vite-plugin-angular/plugin';

export default defineConfig({
  plugins: [angular()],
});
