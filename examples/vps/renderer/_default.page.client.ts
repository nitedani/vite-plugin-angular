import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { HttpClientModule } from '@angular/common/http';
import { PageContext } from 'types';
import { SharedModule } from './shared.module';

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
