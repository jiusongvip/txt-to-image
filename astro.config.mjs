import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  trailingSlash: 'never',
  site: 'https://txt-to-image.com',
});
