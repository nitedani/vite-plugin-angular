import { Request, Response } from 'express';
import { PageContextBuiltIn } from 'vite-plugin-ssr';
import { Type } from '@angular/core';
export interface ReqRes {
  req: Request;
  res: Response;
}
export interface PageContext extends PageContextBuiltIn, ReqRes {
  documentProps: any;
  pageProps: any;
  queryState: any;
  exports: {
    Layout: Type<any>;
    [key: string]: unknown;
  };
}
