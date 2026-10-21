import { copyFile, cp } from 'node:fs/promises';

// Publish readable source, while the independent review viewer uses Vite bundles.
for (const name of ['flow.js','rows.js','layout.js']) {
  await copyFile(new URL(`../src/scene/${name}`,import.meta.url),new URL(`../public/experience/${name}`,import.meta.url));
}

await cp(new URL("../src/experience/",import.meta.url),new URL("../public/experience/",import.meta.url),{recursive:true});
