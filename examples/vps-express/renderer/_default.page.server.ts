import { renderToString } from '@nitedani/vite-plugin-angular/server';
import { dangerouslySkipEscape, escapeInject } from 'vite-plugin-ssr';
import logoUrl from './logo.svg';
import { PageContext } from './types';

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ['pageProps'];

export async function render(pageContext: PageContext) {
  const { Page, pageProps, exports, documentProps } = pageContext;
  const title = (documentProps && documentProps.title) || 'App';
  let html = '';

  if (Page) {
    html = await renderToString({
      page: Page,
      layout: exports.Layout,
      pageProps,
    });
  }
  // See https://vite-plugin-ssr.com/head
  return {
    documentHtml: escapeInject`<!DOCTYPE html>
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
        <div id="page-view" style="height: 100%; overflow: hidden;">${dangerouslySkipEscape(
          html
        )}</div>
      </body>
    </html>`,
    pageContext: {},
  };
}
