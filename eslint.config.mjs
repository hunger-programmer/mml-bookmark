import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// Shared config for library packages (core, db, ui).
// packages/app has its own config built on eslint-config-next.
export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/dist/**", "packages/app/**"]),
  ...tseslint.configs.recommended,
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },

  // Package boundaries (AGENTS.md "Package rules"). Keep in sync with the dependency direction.
  {
    files: ["packages/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react/*", "react-dom", "react-dom/*", "next", "next/*"], message: "core is framework-agnostic: no React or Next.js." },
            { group: ["@mikro-orm/*", "pg", "kysely"], message: "core has no database driver. Declare a repository port; db implements it." },
            { group: ["@mml-bookmark/*"], message: "core depends on no internal package." },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@mml-bookmark/*", "server-only", "awilix", "@mikro-orm/*"], message: "ui is presentational: no internal packages, DI container or database." },
          ],
        },
      ],
      "no-restricted-globals": ["error", { name: "fetch", message: "ui does not fetch data. Receive it through props." }],
    },
  },
  {
    files: ["packages/db/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react/*", "next", "next/*"], message: "db is server-side data code: no React or Next.js." },
            { group: ["@mml-bookmark/db", "@mml-bookmark/ui", "@mml-bookmark/ui/*", "@mml-bookmark/app", "@mml-bookmark/app/*"], message: "db may import only @mml-bookmark/core." },
          ],
        },
      ],
    },
  },
]);
