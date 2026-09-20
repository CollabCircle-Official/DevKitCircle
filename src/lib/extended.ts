import {
  strFromU8,
  strToU8,
  gzipSync,
  gunzipSync,
  deflateSync,
  inflateSync,
  zipSync,
  unzipSync,
} from "fflate";

export const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export const hexToBytes = (hex: string) => {
  const clean = hex.replace(/\s|0x/g, "");
  if (!/^[\da-f]*$/i.test(clean) || clean.length % 2)
    throw new Error("HEX must contain complete byte pairs.");
  return Uint8Array.from(
    clean.match(/.{2}/g)?.map((v) => parseInt(v, 16)) ?? [],
  );
};

export function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value))
    return { type: "array", items: value.length ? inferSchema(value[0]) : {} };
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return {
      type: "object",
      properties: Object.fromEntries(
        entries.map(([k, v]) => [k, inferSchema(v)]),
      ),
      required: entries.map(([k]) => k),
      additionalProperties: false,
    };
  }
  return {
    type:
      typeof value === "number"
        ? Number.isInteger(value)
          ? "integer"
          : "number"
        : typeof value,
  };
}

export function ipv4Details(input: string, prefix: number) {
  const parts = input.trim().split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255) ||
    prefix < 0 ||
    prefix > 32
  )
    throw new Error("Enter a valid IPv4 address and CIDR prefix.");
  const ip = parts.reduce((a, n) => (a * 256 + n) >>> 0, 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0,
    broadcast = (network | (~mask >>> 0)) >>> 0;
  const fmt = (n: number) =>
    [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
  const count = 2 ** (32 - prefix);
  return {
    address: fmt(ip),
    network: fmt(network),
    broadcast: fmt(broadcast),
    netmask: fmt(mask),
    wildcard: fmt(~mask >>> 0),
    first: fmt(prefix >= 31 ? network : (network + 1) >>> 0),
    last: fmt(prefix >= 31 ? broadcast : (broadcast - 1) >>> 0),
    addresses: count.toLocaleString(),
    binary: parts.map((n) => n.toString(2).padStart(8, "0")).join("."),
    classification:
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
        ? "Private"
        : parts[0] === 127
          ? "Loopback"
          : parts[0] >= 224 && parts[0] <= 239
            ? "Multicast"
            : "Public or reserved",
  };
}

export function cronExplanation(expression: string) {
  const p = expression.trim().split(/\s+/);
  if (p.length !== 5)
    throw new Error("Use a standard five-field cron expression.");
  const names = ["minute", "hour", "day of month", "month", "day of week"];
  const explain = (v: string, n: string) =>
    v === "*"
      ? `every ${n}`
      : v.startsWith("*/")
        ? `every ${v.slice(2)} ${n}s`
        : v.includes(",")
          ? `${n} ${v.split(",").join(", ")}`
          : v.includes("-")
            ? `${n}s ${v.replace("-", " through ")}`
            : `${n} ${v}`;
  return p.map((v, i) => explain(v, names[i])).join("; ");
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function mockRecords(count: number, seed: number) {
  const rnd = seeded(seed),
    first = ["Avery", "Maya", "Noah", "Lina", "Aria", "Omar", "Theo", "Zara"],
    last = [
      "Chen",
      "Rahman",
      "Patel",
      "Smith",
      "Kim",
      "Garcia",
      "Silva",
      "Okafor",
    ];
  return Array.from({ length: Math.max(1, Math.min(500, count)) }, (_, i) => {
    const f = first[Math.floor(rnd() * first.length)],
      l = last[Math.floor(rnd() * last.length)];
    return {
      id: crypto.randomUUID(),
      name: `${f} ${l}`,
      email: `${f}.${l}${i + 1}@example.test`.toLowerCase(),
      active: rnd() > 0.25,
      score: Math.floor(rnd() * 101),
      createdAt: new Date(
        Date.now() - Math.floor(rnd() * 31536000000),
      ).toISOString(),
    };
  });
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base32Encode(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bits = "",
    out = "";
  bytes.forEach((b) => (bits += b.toString(2).padStart(8, "0")));
  for (let i = 0; i < bits.length; i += 5)
    out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return out;
}
export function base32Decode(text: string) {
  let bits = "";
  for (const c of text.toUpperCase().replace(/=|\s/g, "")) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error("Invalid Base32 input.");
    bits += i.toString(2).padStart(5, "0");
  }
  return new TextDecoder().decode(
    Uint8Array.from(bits.match(/.{8}/g)?.map((x) => parseInt(x, 2)) ?? []),
  );
}
export function base58Encode(text: string) {
  const bytes = new TextEncoder().encode(text);
  let n = bytes.reduce((a, b) => (a << BigInt(8)) + BigInt(b), BigInt(0)),
    out = "";
  while (n) {
    out = B58[Number(n % BigInt(58))] + out;
    n /= BigInt(58);
  }
  for (const b of bytes) {
    if (b) break;
    out = "1" + out;
  }
  return out || "1";
}
export function base58Decode(text: string) {
  let n = BigInt(0);
  for (const c of text) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("Invalid Base58 input.");
    n = n * BigInt(58) + BigInt(i);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  let bytes = hexToBytes(hex);
  const zeros = text.match(/^1+/)?.[0].length ?? 0;
  if (zeros) bytes = Uint8Array.from([...new Uint8Array(zeros), ...bytes]);
  return new TextDecoder().decode(bytes);
}

export async function compressText(
  text: string,
  mode: "gzip" | "deflate" | "zip",
) {
  const data = strToU8(text);
  const output =
    mode === "gzip"
      ? gzipSync(data)
      : mode === "deflate"
        ? deflateSync(data)
        : zipSync({ "content.txt": data });
  return btoa(String.fromCharCode(...output));
}
export async function decompressText(
  value: string,
  mode: "gzip" | "deflate" | "zip",
) {
  const data = Uint8Array.from(atob(value.replace(/\s/g, "")), (c) =>
    c.charCodeAt(0),
  );
  return mode === "gzip"
    ? strFromU8(gunzipSync(data))
    : mode === "deflate"
      ? strFromU8(inflateSync(data))
      : strFromU8(Object.values(unzipSync(data))[0]);
}

export function flatten(
  value: unknown,
  prefix = "",
  out: Record<string, unknown> = {},
) {
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      const key = prefix ? `${prefix}.${k}` : k;
      flatten(v, key, out);
    }
  } else out[prefix] = value;
  return out;
}
export function unflatten(value: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [path, val] of Object.entries(value)) {
    const keys = path.split(".");
    let cursor = out;
    keys.forEach((key, i) => {
      if (i === keys.length - 1) cursor[key] = val;
      else
        cursor =
          (cursor[key] as Record<string, unknown>) ??
          ((cursor[key] = {}) as Record<string, unknown>);
    });
  }
  return out;
}

export function permissionDetails(octal: string) {
  const clean = octal.trim().replace(/^0/, "");
  if (!/^[0-7]{3,4}$/.test(clean))
    throw new Error("Enter a three or four digit octal mode.");
  const digits = clean.slice(-3).split("").map(Number);
  const tri = (n: number) =>
    `${n & 4 ? "r" : "-"}${n & 2 ? "w" : "-"}${n & 1 ? "x" : "-"}`;
  return {
    symbolic: digits.map(tri).join(""),
    command: `chmod ${clean} <file>`,
    owner: tri(digits[0]),
    group: tri(digits[1]),
    others: tri(digits[2]),
    special: clean.length === 4 ? clean[0] : "0",
  };
}

export function transformText(input: string, operation: string) {
  switch (operation) {
    case "UPPERCASE":
      return input.toUpperCase();
    case "lowercase":
      return input.toLowerCase();
    case "Title Case":
      return input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    case "camelCase":
      return words(input)
        .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w))
        .join("");
    case "snake_case":
      return words(input).join("_");
    case "kebab-case":
      return words(input).join("-");
    case "Sort lines":
      return input
        .split(/\r?\n/)
        .sort((a, b) => a.localeCompare(b))
        .join("\n");
    case "Deduplicate lines":
      return [...new Set(input.split(/\r?\n/))].join("\n");
    case "Reverse":
      return [...input].reverse().join("");
    case "ROT13":
      return input.replace(/[a-z]/gi, (c) =>
        String.fromCharCode(
          ((c.charCodeAt(0) - (c <= "Z" ? 65 : 97) + 13) % 26) +
            (c <= "Z" ? 65 : 97),
        ),
      );
    default:
      return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
  }
}
const words = (s: string) =>
  s
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
