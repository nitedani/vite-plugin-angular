import * as wbl from '@angular-devkit/build-angular/src/tools/babel/webpack-loader.js';
import * as app from '@angular-devkit/build-angular/src/tools/babel/presets/application.js';

let requiresLinking: Function;
/**
 * Workaround for compatibility with Angular 16.2+
 */
if (typeof (wbl as any)['requiresLinking'] !== 'undefined') {
  requiresLinking = (wbl as any).requiresLinking;
} else if (typeof (app as any)['requiresLinking'] !== 'undefined') {
  requiresLinking = (app as any)['requiresLinking'] as Function;
}

export { requiresLinking };
