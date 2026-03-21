import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  worker: {
    entrypoint: ".open-next/worker.js",
  },
});