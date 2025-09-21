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
    lib: {
      entry: path.resolve(__dirname, "src/webviews/bootstrap.tsx"),
      name: "GithubDesktopWebview",
      formats: ["iife"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
});