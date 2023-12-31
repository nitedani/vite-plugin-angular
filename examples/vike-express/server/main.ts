import express from 'express';
import httpDevServer from 'vavite/http-dev-server';
import { vike } from 'vike-adapter-express';

bootstrap();

async function bootstrap() {
  const app = express();
  app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello World!' });
  });
  app.use(vike());
  if (import.meta.env.PROD) {
    const port = process.env.PORT || 3000;
    app.listen(port);
  } else {
    httpDevServer!.on('request', app);
  }
}
