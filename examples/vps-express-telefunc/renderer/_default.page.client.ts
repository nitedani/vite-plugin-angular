import { renderPage } from '@nitedani/vite-plugin-angular/client';
import { SharedModule } from './shared.module';
import { PageContext } from 'types_';
import { provideHttpClient } from '@angular/common/http';
import { QueryClient, hydrate } from '@tanstack/query-core';
import { provideQueryClient } from '@ngneat/query';

export const clientRouting = true;
export { render };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
    },
  },
});

async function render(pageContext: PageContext) {
  const { Page, exports, queryState } = pageContext;
  if (queryState) {
    hydrate(queryClient, queryState);
  }

  await renderPage({
    page: Page,
    pageContext,
    layout: exports.Layout,
    imports: [SharedModule],
    providers: [provideQueryClient(queryClient), provideHttpClient()],
  });
}
