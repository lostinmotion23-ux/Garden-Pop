import { existsSync } from 'node:fs';

// Use Playwright's installed Chromium on Windows/macOS and retain the cloud
// image's system Chromium. An explicit path supports other local installations.
export const browserExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (process.platform === 'linux' && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
