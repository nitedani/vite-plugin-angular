## Vite plugin for Angular.

```
npm init @nitedani/vite-angular-app
```

### Features:

- Fast live-reload, both in browser([vite](https://vitejs.dev/)) and server code([vavite](https://github.com/cyco130/vavite))
- Easy SSR(optional) using [Vike](https://vike.dev/)
- Optionally, in development mode, it uses [SWC](https://swc.rs/) and the Angular JIT compiler in the browser to keep it fast.
- In build mode, it uses the Angular AOT compiler to produce small bundles.

### Examples without SSR:

- [Simple](./examples/simple/)
- [Angular routing module](./examples/routing-module/)
- [Angular Material](./examples/material/)

### Examples with SSR:

- [Express SSR](./examples/express/)
- [NestJS SSR](./examples/universal/)
- [Vike + NestJS](./examples/vike-nestjs/)
- [Vike + Express](./examples/vike-express/)
- [Vike + Express + Telefunc](./examples/vike-express-telefunc/)

| Related packages                          | Included in @nitedani/vite-plugin-angular |
| ----------------------------------------- | ----------------------------------------- |
| @nitedani/angular-renderer-core           | ✓                                         |
| @nitedani/angular-renderer-express        | X                                         |
| @nitedani/angular-renderer-nestjs         | X                                         |
| @nitedani/vite-plugin-ssr-adapter-express | X                                         |
| @nitedani/vite-plugin-ssr-adapter-nestjs  | X                                         |

### Usage:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { angular } from "@nitedani/vite-plugin-angular/plugin";

export default defineConfig({
  plugins: [angular()],
});
```