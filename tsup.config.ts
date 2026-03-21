import { defineConfig } from 'tsup';

/** Keep in sync with package.json peerDependencies + CSS side-effect imports. */
const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'antd',
  '@ant-design/icons',
  '@xyflow/react',
  '@xyflow/react/dist/style.css',
  'styled-components',
  'react-i18next',
  'i18next',
  '@refinedev/antd',
  '@refinedev/core',
  'solar-icon-set'
];

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  external,
  esbuildOptions(options) {
    options.jsx = 'automatic';
    // Raw SVG as string, then encode in code — esbuild `dataurl` can emit invalid `data:image/svg+xml,<svg...` URLs.
    options.loader = {
      ...options.loader,
      '.svg': 'text'
    };
  }
});
