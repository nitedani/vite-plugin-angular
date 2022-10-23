import express from 'express';
import httpDevServer from 'vavite/http-dev-server';
import { vpsMiddleware } from '@nitedani/vite-plugin-ssr-adapter-express';
import { provideTelefuncContext, telefunc } from 'telefunc';
bootstrap();

async function bootstrap() {
  const app = express();

  app.use(express.text());
  app.all('/_telefunc', async (req, res) => {
    provideTelefuncContext({ req, res });
    const httpResponse = await telefunc({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
    });
    const { body, statusCode, contentType } = httpResponse;
    res.status(statusCode).type(contentType).send(body);
  });

  app.get('api/hello', (req, res) => {
    res.send('Hello World!');
  });
  app.use(vpsMiddleware());
  if (import.meta.env.PROD) {
    const port = process.env.PORT || 3000;
    app.listen(port);
  } else {
    httpDevServer.on('request', app);
  }
}
