import type { Type } from '@angular/core';
import { InjectionToken } from '@angular/core';

export { PageContextServer, PageContextClient, PageContext, PageProps, ReqRes };

import type { Request, Response } from 'express';
import type {
  PageContextBuiltInServer,
  PageContextBuiltInClientWithClientRouting as PageContextBuiltInClient,
} from 'vike/types';

type Page = Type<any>;
type PageProps = Record<string, unknown>;

export type PageContextCustom = {
  Page: Page;
  pageProps?: PageProps;
  urlPathname: string;
  queryState: any;
  exports: {
    Layout?: Page;
  };
};

type ReqRes = {
  req: Request;
  res: Response;
};

type PageContextServer = PageContextBuiltInServer<Page> &
  PageContextCustom &
  ReqRes;
type PageContextClient = PageContextBuiltInClient<Page> & PageContextCustom;

type PageContext = PageContextClient | PageContextServer;

const PageContext = new InjectionToken<PageContext>('PageContext');
