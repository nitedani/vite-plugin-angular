export { onRenderHtml };

import { renderToString } from '@vikejs/vite-plugin-angular/server';
import { dangerouslySkipEscape, escapeInject } from 'vike/server';
import logoUrl from './logo.svg';
import { PageContext, type PageContextServer } from './types';
import { SharedModule } from '#root/renderer/shared.module';

const onRenderHtml = async (pageContext: PageContextServer) => {
  const { Page, exports } = pageContext;
  const title = 'App';

  // See https://vite-plugin-ssr.com/head
  let document = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta name="color-scheme" content="dark light" />
      <meta name="description" content="App" />
      <meta charset="UTF-8" />
      <link rel="icon" href="${logoUrl}" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="height: 100vh;">
      <app-root></app-root>
    </body>
  </html>`;

  if (Page) {
    document = await renderToString({
      page: Page,
      layout: exports.Layout,
      imports: [SharedModule],
      providers: [{ provide: PageContext, useValue: pageContext }],
      document,
      serverUrl: `${pageContext.req.protocol}://${pageContext.req.get('host')}`,
    });
  }

  return {
    documentHtml: escapeInject`${dangerouslySkipEscape(document)}`,
    pageContext: {},
  };
};
