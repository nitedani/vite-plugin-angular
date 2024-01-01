import { angular } from '@vikejs/vite-plugin-angular/plugin';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';

export default defineConfig({
  resolve: {
    alias: {
      '#root': __dirname,
    },
  },
  plugins: [angular(), vike()],
});
