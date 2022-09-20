import { Request, Response } from 'express';
import { PageContextBuiltIn } from 'vite-plugin-ssr';
import { Type } from '@angular/core';

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
