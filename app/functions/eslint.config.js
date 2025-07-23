// Arquivo: functions/eslint.config.js

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";

export default [
  // Configuração para o ambiente Node.js global
  { languageOptions: { globals: { ...globals.node } } },

  // Configurações recomendadas do ESLint e TypeScript
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Configurações específicas do nosso projeto de backend
  {
    plugins: {
      import: pluginImport,
    },
    rules: {
      "import/no-unresolved": 0, // Desativa uma regra que pode ser problemática com Cloud Functions
      "quotes": ["error", "double"],
    },
  },
];