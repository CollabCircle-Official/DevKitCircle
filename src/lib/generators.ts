const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(now = Date.now()): string {
  let time = now;
  let output = "";
  for (let i = 0; i < 10; i++) {
    output = CROCKFORD[time % 32] + output;
    time = Math.floor(time / 32);
  }
  const random = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 16; i++) output += CROCKFORD[random[i] % 32];
  return output;
}

export function parseColor(input: string): { r: number; g: number; b: number } {
  const value = input.trim().toLowerCase();
  const hex = value.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const h =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((c) => c + c)
            .join("")
        : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return checked(+rgb[1], +rgb[2], +rgb[3]);
  const hsl = value.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/,
  );
  if (hsl) return hslToRgb(+hsl[1], +hsl[2], +hsl[3]);
  throw new Error(
    "Use HEX, RGB, or HSL (for example #6366f1). Tailwind values can be pasted as HEX.",
  );
}

function checked(r: number, g: number, b: number) {
  if ([r, g, b].some((v) => v < 0 || v > 255))
    throw new Error("RGB values must be between 0 and 255.");
  return { r, g, b };
}
function hslToRgb(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2;
  let a = [0, 0, 0];
  if (h < 60) a = [c, x, 0];
  else if (h < 120) a = [x, c, 0];
  else if (h < 180) a = [0, c, x];
  else if (h < 240) a = [0, x, c];
  else if (h < 300) a = [x, 0, c];
  else a = [c, 0, x];
  return {
    r: Math.round((a[0] + m) * 255),
    g: Math.round((a[1] + m) * 255),
    b: Math.round((a[2] + m) * 255),
  };
}
export function colorDetails(c: { r: number; g: number; b: number }) {
  const hex =
    `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  const max = Math.max(c.r, c.g, c.b) / 255,
    min = Math.min(c.r, c.g, c.b) / 255,
    d = max - min;
  let h = 0;
  if (d) {
    if (max === c.r / 255) h = 60 * (((c.g - c.b) / 255 / d) % 6);
    else if (max === c.g / 255) h = 60 * ((c.b - c.r) / 255 / d + 2);
    else h = 60 * ((c.r - c.g) / 255 / d + 4);
  }
  if (h < 0) h += 360;
  const l = (max + min) / 2,
    s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return {
    hex,
    rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
    hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
  };
}
function luminance(c: { r: number; g: number; b: number }) {
  const values = [c.r, c.g, c.b].map((v) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
export function contrast(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}
