import shrinkRay from '@nitedani/shrink-ray-current';
import defu from 'defu';
import {
  NextFunction,
  Request,
  Response,
  static as expressStatic,
} from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  renderToString,
  RenderToStringOptions,
} from '@nitedani/angular-renderer-core/server';
import type { Type } from '@angular/core';
const __dirname = dirname(fileURLToPath(import.meta.url));
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
export type PageContextInit = {
  urlOriginal: string;
  req: Request;
  res: Response;
};
export interface AngularRendererOptions
  extends Omit<RenderToStringOptions, 'pageContext'> {
  page: Type<{}>;
  root?: string;
  pageContext?:
    | ((pageContextInit: PageContextInit) => Promise<any> | any)
    | any;
  serveStaticProps?: Parameters<typeof expressStatic>[1];
  compress?: boolean;
  cache?: boolean;
}

export const angularRenderer = (options?: AngularRendererOptions) => {
  const {
    root,
    pageContext,
    serveStaticProps,
    cache,
    compress,
    page,
    ...rendererOptions
  } = defu(options, {
    root: join(__dirname, '..', 'client'),
    pageContext: async pageContextInit => pageContextInit,
    compress: true,
    cache: true,
    serveStaticProps: {
      index: false,
    },
  });

  const middlewares: Middleware[] = [];
  if (import.meta.env.PROD) {
    if (compress) {
      middlewares.push(
        // @ts-ignore
        shrinkRay({
          cacheSize: cache ? '128mB' : false,
        })
      );
    }

    middlewares.push(expressStatic(root, serveStaticProps));
  }

  middlewares.push(async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    const urlOriginal = req.originalUrl;
    const pageContextInit = {
      urlOriginal,
      req,
      res,
    };
    const pageContextMerged = {
      ...pageContextInit,
      ...(typeof pageContext === 'function'
        ? await pageContext(pageContextInit)
        : pageContext),
    };
    const html = await renderToString({
      page,
      root,
      // loads index.html from root
      indexHtml: true,
      serverUrl: `${req.protocol}://${req.get('host')}`,
      pageContext: pageContextMerged,
      ...rendererOptions,
    });
    res.type('html');
    res.send(html);
  });

  return middlewares;
};
