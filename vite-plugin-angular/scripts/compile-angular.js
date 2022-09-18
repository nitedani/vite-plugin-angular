import { NgtscProgram, readConfiguration } from '@angular/compiler-cli';
import { dirname, resolve } from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const { options, rootNames } = readConfiguration(
  resolve(__dirname, '..', 'tsconfig.angular.json')
);
const host = ts.createIncrementalCompilerHost(options);
const program = new NgtscProgram(rootNames, options, host);
const ngtsc = program.getTsProgram();
const transformers = program.compiler.prepareEmit().transformers;

for (const r of rootNames) {
  const file = ngtsc.getSourceFile(r);
  ngtsc.emit(file, undefined, undefined, undefined, transformers);
}
