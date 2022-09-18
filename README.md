Vite plugin for Angular.
---

This plugin is work in progress. The interfaces can change any time. Don't use it for production!

Features:
- Fast live-reload, both in browser and server
- Easy SSR(optional) using [vite-plugin-ssr](https://vite-plugin-ssr.com/), [filesystem routing](https://vite-plugin-ssr.com/filesystem-routing), [layout components](https://vite-plugin-ssr.com/layouts)
- In development mode, it uses [SWC](https://swc.rs/) and the Angular JIT compiler in the browser to keep it fast.
- In build mode, it uses [esbuild](https://esbuild.github.io/) and the Angular AOT compiler to produce small bundles.

Examples:
- [A simple example](./examples/simple/)
- [Angular Material example](./examples/material/)
- [NestJS SSR example](./examples/universal/)
- [vite-plugin-ssr example](./examples/vps/)



TODO:
- handling of environment files
- make sure it works with angular libraries

Usage:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { angular } from '@nitedani/vite-plugin-angular/plugin';

export default defineConfig({
  plugins: [angular()],
});


```

Credits:
- https://github.com/nxext/nx-extensions
- https://github.com/analogjs/analog