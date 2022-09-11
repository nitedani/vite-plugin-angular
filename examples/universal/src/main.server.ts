/***************************************************************************************************
 * Initialize the server environment - for example, adding DOM built-in types to the global scope.
 *
 * NOTE:
 * This import must come before any imports (direct or transitive) that rely on DOM built-ins being
 * available, such as `@angular/elements`.
 */

import 'zone.js/dist/zone-node';
import '@angular/compiler';
import '@angular/platform-server/init';
import { enableProdMode } from '@angular/core';

if (import.meta.env.PROD) {
  enableProdMode();
}

export { AppServerModule } from './app/app.server.module';
