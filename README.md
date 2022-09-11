Vite plugin for Angular.
---

This plugin is work in progress. Don't use it for production!

[A simple example](./examples/simple/)
[Angular Material example](./examples/material/)
[Angular Universal + NestJS SSR example](./examples/universal/)

What's working:
- hot-reload
- scss support
- dependency injection

TODO:
- handling of environment files


Usage:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { vpa } from '@nitedani/vite-plugin-angular';

export default defineConfig({
  plugins: [vpa()],
});


```

Credits:
- https://github.com/nxext/nx-extensions