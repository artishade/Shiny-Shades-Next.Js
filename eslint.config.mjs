// eslint-config-next is pinned to next's version (15.5.23) and only ships the
// legacy eslintrc format, so FlatCompat is what bridges it into flat config.
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'public/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Product/category/media imagery is served from Cloudinary at whatever
      // dimensions the CMS happens to store, and the storefront is being
      // redesigned. `<Image>` needs intrinsic sizes or `fill` on a positioned
      // parent per call site, so this is re-enabled (and the markup migrated)
      // as part of that redesign rather than churning 21 tags now.
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;
