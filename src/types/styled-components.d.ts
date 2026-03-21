import 'styled-components';

/** Host apps (e.g. khaojai-ui) provide `theme.colors`; declare so this package typechecks standalone. */
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: Record<string, string>;
  }
}
