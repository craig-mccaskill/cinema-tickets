import globals from "globals";
import { defineConfig, globalIgnores  } from "eslint/config";

export default defineConfig([
  globalIgnores(["coverage/**", "logs/**"]),
  { 
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.browser },
  },
]);
