declare module '*.svg' {
  /** With esbuild `text` loader (tsup): raw SVG markup */
  const src: string;
  export default src;
}
