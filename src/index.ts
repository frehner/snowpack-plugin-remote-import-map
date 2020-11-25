import type { SnowpackPlugin, SnowpackPluginFactory } from "snowpack/lib/index";
import { transformEsmImports } from "snowpack/lib/rewrite-imports";

interface Imports {
  [key: string]: string;
}

interface PluginOptions {
  url: {
    prod: string;
    dev?: string;
  } | undefined;
  extensions: string[];
}

const plugin: SnowpackPluginFactory = (
  _snowpackConfig,
  pluginOptions,
): SnowpackPlugin => {
  const { url, extensions = [".js", ".jsx", ".tsx", ".ts"] } = pluginOptions as PluginOptions
  if(!url?.prod) throw new Error('no go')
  
  return {
    name: "snowpack-plugin-remote-import-map",
    async transform({ contents, fileExt, isDev }) {
      contents = contents.toString();
  
      const remoteImportMapUrl = isDev && url.dev ? url.dev : url.prod;
      let remoteImports: Imports = {};
      try {
        const remote = await fetch(remoteImportMapUrl).then((res) => res.json());
        remoteImports = remote.imports;
      } catch (e) {
        throw new Error(`${plugin.name} failed: ${e.message}`);
      }
  
      if (extensions.includes(fileExt.toLowerCase())) {
        const replaceImport = (specifier: string) =>
        remoteImports[specifier] || specifier;
        return transformEsmImports(contents, replaceImport);
      }
      return contents
    },
  }
};

export default plugin;