declare module "next/types.js" {
  export type ResolvingMetadata = Promise<Record<string, unknown>>;
  export type ResolvingViewport = Promise<Record<string, unknown>>;
}

declare module "next/font/google" {
  type FontOptions = {
    variable?: string;
    subsets?: string[];
    weight?: string | string[];
    display?: string;
  };

  type FontResult = {
    className: string;
    variable: string;
    style: Record<string, string>;
  };

  export function Geist(options?: FontOptions): FontResult;
  export function Geist_Mono(options?: FontOptions): FontResult;
}
