import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Package boundaries (AGENTS.md "Package rules") and shared-layer rules.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@mml-bookmark/*/src/*", "**/packages/**"], message: "Import other packages through their exports only." },
            { group: ["@mikro-orm/*"], message: "Only @mml-bookmark/db imports MikroORM." },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch'][arguments.0.value=/^\\/api\\//]",
          message: "Call /api/* through apiCall from @/lib/api-client.",
        },
      ],
    },
  },
  { files: ["src/lib/api-client.ts"], rules: { "no-restricted-syntax": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
