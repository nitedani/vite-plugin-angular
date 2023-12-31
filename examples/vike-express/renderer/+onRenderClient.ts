export { onRenderClient };

import { renderPage } from '@vikejs/vite-plugin-angular/client';
import { SharedModule } from '#root/renderer/shared.module';
import { PageContext, PageContextClient } from './types';

const onRenderClient = async (pageContext: PageContextClient) => {
  const { Page, exports } = pageContext;

  await renderPage({
    page: Page,
    layout: exports.Layout,
    imports: [SharedModule],
    providers: [{ provide: PageContext, useValue: pageContext }],
  });
};
