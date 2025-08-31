import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "es",
      sourcemap: true,
      exports: "named",
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      exclude: [
        "tests/**/*",
        "**/*.test.ts",
        "**/*.spec.ts",
        "node_modules",
        "dist",
        "coverage",
      ],
    }),
    nodeResolve(),
    commonjs(),
  ],
  external: ["fs", "path"],
  treeshake: true,
};
