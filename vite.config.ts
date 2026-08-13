import { defineConfig } from "vite";

export default defineConfig({
  // Legion is deployed at https://alexandrsorochkin06-cloud.github.io/Legion/
  base: "/Legion/",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
