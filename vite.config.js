import { defineConfig } from "vite";
export default defineConfig({
  build: { rolldownOptions: { input: ["index.html", "game.html", "animal-art.html"] } },
});
