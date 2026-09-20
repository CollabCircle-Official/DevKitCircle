import { md5 } from "js-md5";

const encoder = new TextEncoder();

export function encodeValue(
  input: string,
  type: "Base64" | "URL" | "HTML",
): string {
  if (type === "Base64") {
    const bytes = encoder.encode(input);
    let binary = "";
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
    return btoa(binary);
  }
  if (type === "URL") return encodeURIComponent(input);
  return input.replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ]!,
  );
}

export function decodeValue(
  input: string,
  type: "Base64" | "URL" | "HTML",
): string {
  if (type === "Base64") {
    const binary = atob(input.replace(/\s/g, ""));
    return new TextDecoder().decode(
      Uint8Array.from(binary, (c) => c.charCodeAt(0)),
    );
  }
  if (type === "URL") return decodeURIComponent(input);
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent ?? "";
}

function decodeJwtPart(part: string): unknown {
  const normalized = part
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(part.length / 4) * 4, "=");
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0)),
    ),
  );
}

export function inspectJwt(token: string) {
  const parts = token.trim().split(".");
  if (parts.length !== 3)
    throw new Error("A JWT must contain three dot-separated segments.");
  const header = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]) as Record<string, unknown>;
  const exp =
    typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null;
  return {
    header,
    payload,
    signature: parts[2],
    expiry: exp,
    expired: exp ? exp.getTime() < Date.now() : null,
  };
}

export async function hashData(
  data: ArrayBuffer,
  algorithm: "MD5" | "SHA-1" | "SHA-256" | "SHA-512",
): Promise<string> {
  if (algorithm === "MD5") return md5(data);
  const digest = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function textBuffer(value: string): ArrayBuffer {
  return encoder.encode(value).buffer as ArrayBuffer;
}
