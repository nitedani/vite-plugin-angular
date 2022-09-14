import { renderToString } from '@nitedani/vite-plugin-angular/server';
import {
  dangerouslySkipEscape,
  escapeInject,
  PageContextBuiltIn,
} from 'vite-plugin-ssr';
import { WrapperPage } from './wrapper.page';
import logoUrl from './logo.svg';

// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ['pageProps'];

export async function render(pageContext: PageContextBuiltIn & any) {
  const { documentProps } = pageContext;
  const title = (documentProps && documentProps.title) || 'App';
  let html = '';

  const { Page, pageProps } = pageContext;

  if (Page) {
    html = await renderToString({
      page: Page,
      wrapperPage: WrapperPage,
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
