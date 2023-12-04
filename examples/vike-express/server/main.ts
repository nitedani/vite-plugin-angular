import express from 'express';
import httpDevServer from 'vavite/http-dev-server';
import { vpsMiddleware } from '@nitedani/vite-plugin-ssr-adapter-express';
bootstrap();

async function bootstrap() {
  const app = express();
  app.get('api/hello', (req, res) => {
    res.send('Hello World!');
  });
  app.use(vpsMiddleware());
  if (import.meta.env.PROD) {
    const port = process.env.PORT || 3000;
    app.listen(port);
  } else {
    httpDevServer!.on('request', app);
  }
}
