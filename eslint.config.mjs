import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, {
  files: ["src/**/*.ts", "src/**/*.tsx"],
  extends: [
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
