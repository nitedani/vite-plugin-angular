import { angularRenderer } from '@nitedani/angular-renderer-express';
import express from 'express';
import httpDevServer from 'vavite/http-dev-server';
import { AppComponent } from 'src/app/app.component';
import { SharedModule } from 'src/shared.module';

bootstrap();

async function bootstrap() {
  const app = express();
  app.get('/api/hello', (req, res) => {
    res.json({
      message: 'Hello World!',
    });
  });
  app.use(
    angularRenderer({
      page: AppComponent,
      imports: [SharedModule],
    })
  );
  if (import.meta.env.PROD) {
    const port = process.env.PORT || 3000;
    app.listen(port);
  } else {
    httpDevServer!.on('request', app);
  }
}
