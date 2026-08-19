import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [tailwind(), sitemap()],
  output: 'static',
  trailingSlash: 'always',
  site: 'https://www.txt-to-image.com',
});
