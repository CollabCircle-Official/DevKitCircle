declare module "gifenc" {
  type PixelFormat = "rgb565" | "rgb444" | "rgba4444";
  type Palette = number[][];

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: PixelFormat },
  ): Palette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: PixelFormat,
  ): Uint8Array;

  export function GIFEncoder(): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options: { palette: Palette; transparent?: boolean },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  };
}
