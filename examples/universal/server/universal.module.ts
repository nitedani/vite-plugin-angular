import { Type } from '@angular/core';
import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CommonEngine } from '@nguniversal/common/engine';
import type { Express, NextFunction, Request, Response } from 'express';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPTIONS = Symbol.for('vite-plugin-angular.options');

import { readFile } from 'fs/promises';
import { cwd } from 'process';

interface AngularOptions {
  root?: string;
  bootstrap: Type<{}>;
}

@Module({})
export class AngularUniversalModule implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(OPTIONS)
    private readonly options: AngularOptions
  ) {}

  static forRoot(options: AngularOptions): DynamicModule {
    options.root ??= join(__dirname, '..', 'client');

    const imports: DynamicModule[] = [];
    if (import.meta.env.PROD) {
      imports.push(
        ServeStaticModule.forRoot({
          rootPath: options.root,
          serveRoot: '/',
          serveStaticOptions: {
            index: false,
          },
        })
      );
    }
    return {
      module: AngularUniversalModule,
      imports,
      providers: [{ provide: OPTIONS, useValue: options }],
    };
  }

  async onModuleInit() {
    if (!this.httpAdapterHost) {
      throw new Error(
        'httpAdapterHost is undefined, no decorator metadata available'
      );
    }
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (!httpAdapter) {
      return;
    }
    const app = httpAdapter.getInstance<Express>();

    const engine = new CommonEngine();

    const documentPath = import.meta.env.DEV
      ? join(cwd(), 'index.html')
      : join(this.options.root, 'index.html');

    let template = await readFile(documentPath, 'utf-8');

    if (import.meta.env.DEV) {
      const devScript = `<script type="module" src="/@vite/client"></script>`;
      template = template.replace('</head>', `${devScript}</head>`);
    }

    app.get('*', async (req: Request, res: Response, _next: NextFunction) => {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      const html = await engine.render({
        document: template,
        bootstrap: this.options.bootstrap,
        providers: [
          {
            provide: 'serverUrl',
            useValue: serverUrl,
          },
        ],
      });
      res.send(html);
    });
  }
}
