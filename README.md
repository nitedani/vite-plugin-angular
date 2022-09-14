Vite plugin for Angular.
---

This plugin is work in progress. Don't use it for production!

- [A simple example](./examples/simple/)
- [Angular Material example](./examples/material/)
- [NestJS ssr example](./examples/universal/)
- [vite-plugin-ssr example](./examples/vps/)

Kind of working:
- hot-reload
- scss support
- dependency injection
- angular universal ssr

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