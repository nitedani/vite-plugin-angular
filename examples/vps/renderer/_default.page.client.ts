import { HttpClientModule } from '@angular/common/http';
import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { PageContext } from 'types';

export const clientRouting = true;
export { render };

async function render(pageContext: PageContext) {
  const { Page, exports } = pageContext;

  await renderPage({
    page: Page,
    pageContext,
    layout: exports.Layout,
    imports: [HttpClientModule],
  });
}
