import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { SharedModule } from './shared.module';
import { PageContext } from 'types';
import { HttpClientModule } from '@angular/common/http';

export const clientRouting = true;
export { render };

async function render(pageContext: PageContext) {
  const { Page, exports } = pageContext;

  await renderPage({
    page: Page,
    pageContext,
    layout: exports.Layout,
    imports: [SharedModule, HttpClientModule],
  });
}
