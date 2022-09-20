// needs to be first import, it loads the polyfills
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { SharedModule } from './shared.module';
import { PageContext } from 'types';

export const clientRouting = true;
export { render };

async function render(pageContext: PageContext) {
  const { Page, exports } = pageContext;

  await renderPage({
    page: Page,
    pageContext,
    layout: exports.Layout,
    imports: [SharedModule],
  });
}
