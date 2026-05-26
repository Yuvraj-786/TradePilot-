// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const INJECTED_HEAD_SCRIPTS_VIRTUAL_ID = "tanstack-start-injected-head-scripts:v";
const INJECTED_HEAD_SCRIPTS_RESOLVED_ID = `\0${INJECTED_HEAD_SCRIPTS_VIRTUAL_ID}`;

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "tanstack-start-injected-head-scripts-fallback",
        enforce: "pre",
        resolveId(id) {
          if (id === INJECTED_HEAD_SCRIPTS_VIRTUAL_ID) {
            return INJECTED_HEAD_SCRIPTS_RESOLVED_ID;
          }

          return undefined;
        },
        load(id) {
          if (id === INJECTED_HEAD_SCRIPTS_RESOLVED_ID) {
            return "export const injectedHeadScripts = undefined";
          }

          return undefined;
        },
      },
    ],
  },
});
