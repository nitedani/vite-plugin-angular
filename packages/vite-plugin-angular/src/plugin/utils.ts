import { mergeConfig } from 'vite';

export const normalizePath = (path: string) => path.replace(/\\/g, '/');
export const usePluginConfig = async (plugin, config, env) => {
  let cc = config;
  for (const p of [plugin].flat()) {
    if (p.config) {
      const ret = await p.config(cc, env);
      if (ret) {
        cc = mergeConfig(cc, ret);
      }
    }
  }

  return cc;
};
export const usePluginTransform = async ({ plugin, code, id, ctx }) => {
  let cc = { code };
  let prev = cc;
  for (const p of [plugin].flat()) {
    if (p.transform) {
      prev = cc;

      cc = await p.transform.call(ctx, cc.code, id);
      cc ??= prev;
    }
  }
  return cc;
};

export const usePluginHandleHotUpdate = async ({ plugin, ctx }) => {
  const mods: any[] = [];

  for (const p of [plugin].flat()) {
    if (p.handleHotUpdate) {
      //@ts-ignore
      const result = await p.handleHotUpdate(ctx);
      if (Array.isArray(result)) {
        mods.push(...result);
      }
    }
  }

  return mods;
};
export const usePluginBuildStart = async ({ plugin, options }) => {
  for (const p of [plugin].flat()) {
    if (p.buildStart) {
      //@ts-ignore
      await p.buildStart(options);
    }
  }
};
export const usePluginConfigureServer = async ({ plugin, server }) => {
  for (const p of [plugin].flat()) {
    if (p.configureServer) {
      //@ts-ignore
      await p.configureServer(server);
    }
  }
};
