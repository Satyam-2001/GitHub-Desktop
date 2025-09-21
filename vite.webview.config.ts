import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@webview": path.resolve(__dirname, "src/webviews"),
    },
  },
  build: {
    sourcemap: true,
    target: "es2020",
    outDir: path.resolve(__dirname, "out/webview"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/webviews/bootstrap.tsx"),
        'commit-detail': path.resolve(__dirname, "src/webviews/commitDetail/index.tsx"),
      },
      output: {
        entryFileNames: '[name].js',
        inlineDynamicImports: false,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
});