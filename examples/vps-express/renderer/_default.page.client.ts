import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { PageContext } from './types';

export { render };
export const clientRouting = true;

async function render(pageContext: PageContext) {
  const { Page, pageProps, exports } = pageContext;
  await renderPage({
    page: Page,
    layout: exports.Layout,
    pageContext: { pageProps },
  });
}
