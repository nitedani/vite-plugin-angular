import type { Request, Response } from 'express';
import type { PageContextBuiltIn } from 'vite-plugin-ssr';
import type { Type } from '@angular/core';

export interface PageContext extends PageContextBuiltIn {
  req: Request;
  res: Response;
  documentProps: any;
  pageProps: any;
  exports: {
    Layout: Type<any>;
    [key: string]: unknown;
  };
}
