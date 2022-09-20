import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  angularRenderer,
  AngularRendererOptions,
} from '@nitedani/angular-renderer-express';
const OPTIONS = Symbol.for('angular-renderer.options');

@Module({
  providers: [{ provide: OPTIONS, useValue: {} }],
})
export class AngularRendererModule implements OnModuleInit {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(OPTIONS)
    private readonly rendererOptions: AngularRendererOptions
  ) {}

  static forRoot(options?: AngularRendererOptions): DynamicModule {
    return {
      module: AngularRendererModule,
      providers: [{ provide: OPTIONS, useValue: options || {} }],
    };
  }

  async onModuleInit() {
    if (!this.httpAdapterHost) {
      throw new Error(
        'httpAdapterHost is undefined, no decorator metadata available'
      );
    }
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (!httpAdapter) {
      return;
    }
    const app = httpAdapter.getInstance();
    app.use(angularRenderer(this.rendererOptions));
  }
}
