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
]);
