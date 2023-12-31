import type { Plugin } from 'vite';
import { swcTransform } from '../swc/transform.js';

export const DevelopmentPlugin: Plugin = {
  name: 'vite-plugin-angular-dev',
  enforce: 'pre',
  apply(_, env) {
    return env.command === 'serve';
  },
  config() {
    return {
      esbuild: false,
    };
  },
  transformIndexHtml(html) {
    const compilerScript = `<script type="module" src="/@angular/compiler"></script>`;
    return html.replace('</head>', `${compilerScript}</head>`);
  },
  resolveId(id) {
    if (id.startsWith('/@angular/compiler')) {
      return this.resolve(id.substring(1));
    }
  },
  transform(code, id) {
    return swcTransform({
      code,
      id,
    });
  },
};
