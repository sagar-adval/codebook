import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from 'localforage';

const fileCache = localForage.createInstance({
    name: 'fileCache'
});

(async () => {
   await fileCache.setItem('color', 'blue');
   const res = await fileCache.getItem('color');
   console.log(res);
})()

export const unpkgPathPlugin = () => {
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log("onResole", args);
        if (args.path === "index.js") {
          return { path: args.path, namespace: "a" };
        }

        if(args.path.includes('./') || args.path.includes('../')) {
          return { path: new URL(args.path, 'https://unpkg.com'+ args.resolveDir+ '/').href, namespace: "a" };
        }

        else return { path: `https://unpkg.com/${args.path}`, namespace: "a" };
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: `
              const message = require('react');
              console.log(message);
            `,
          };
        } else {
            // Check to see if we have already stored this file in cache, If it is stored in cache, return it immediately
            const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
            if(cachedResult) return cachedResult;

            //If it is not found in cache
              const { data, request } = await axios.get(args.path);
              // console.log(request);
              const result: esbuild.OnLoadResult = {
                loader: 'jsx',
                contents: data,
                resolveDir: new URL('./', request.responseURL).pathname
              };
              //Store response in cache
            await fileCache.setItem(args.path, result);
            return result;
        }

      });
    },
  };
};
