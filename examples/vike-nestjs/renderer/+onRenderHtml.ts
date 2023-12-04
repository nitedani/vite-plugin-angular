export { onRenderHtml };

import { renderToString } from '@nitedani/vite-plugin-angular/server';
import { dangerouslySkipEscape, escapeInject } from 'vike/server';
import logoUrl from './logo.svg';
import { SharedModule } from '#root/renderer/shared.module';
import { PageContext, PageContextServer } from './types';

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
      providers: [{ provide: PageContext, useValue: pageContext }],
      layout: exports.Layout,
      imports: [SharedModule],
      document,
    });
  }

  return {
    documentHtml: escapeInject`${dangerouslySkipEscape(document)}`,
    pageContext: {},
  };
};
