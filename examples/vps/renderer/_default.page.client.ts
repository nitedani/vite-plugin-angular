import { renderPage } from '@nitedani/vite-plugin-angular/client';
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router';
import { WrapperPage } from './wrapper.page';

export { render };
export const clientRouting = true;

async function render(pageContext: PageContextBuiltInClient & any) {
  const { Page, pageProps } = pageContext;

  const container = document.getElementById('page-view')!;
  renderPage({
    page: Page,
    wrapperPage: WrapperPage,
    pageProps,
    container,
  });
}
