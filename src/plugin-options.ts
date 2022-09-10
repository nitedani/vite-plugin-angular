import type { JscTarget, Options } from '@swc/core';

export interface AngularVitePluginOptions {
  target: JscTarget;
  swc?: Options;
}
