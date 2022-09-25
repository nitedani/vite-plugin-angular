// needs to be first import, it loads the polyfills
import { renderToString } from '@nitedani/vite-plugin-angular/server';
import { dangerouslySkipEscape, escapeInject } from 'vite-plugin-ssr';
import logoUrl from './logo.svg';
import { PageContext } from 'types';
import { SharedModule } from './shared.module';

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ['pageProps'];

export async function render(pageContext: PageContext) {
  const { Page, exports, documentProps } = pageContext;
  const title = (documentProps && documentProps.title) || 'App';

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
      pageContext,
      layout: exports.Layout,
      imports: [SharedModule],
      document,
    });
  }

  return {
    documentHtml: escapeInject`${dangerouslySkipEscape(document)}`,
    pageContext: {},
  };
}
