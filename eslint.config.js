import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import noSilentFallback from "./eslint-rules/no-silent-fallback.js";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // Phase 0 D-0.12 — local plugin for the no-fallback charter.
      "local": { rules: { "no-silent-fallback": noSilentFallback } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // D-0.12 starts at "warn". Phase 1 D-1.12 + Phase 3 D-3.15
      // review the emission patterns; post-Phase-1 stabilization
      // the rule may promote to "error".
      "local/no-silent-fallback": "warn",
    },
  }
);
