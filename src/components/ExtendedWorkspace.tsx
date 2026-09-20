/* eslint-disable @next/next/no-img-element -- previews use runtime-generated data URLs */
"use client";
import { useMemo, useState } from "react";
import Ajv from "ajv";
import { diffLines, diffJson } from "diff";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { Play, Plus, Trash2 } from "lucide-react";
import type { ToolId } from "@/types";
import { CopyButton, Editor, ErrorBox, FileButton, Select } from "./ToolUI";
import {
  base32Decode,
  base32Encode,
  base58Decode,
  base58Encode,
  bytesToHex,
  compressText,
  cronExplanation,
  decompressText,
  flatten,
  hexToBytes,
  inferSchema,
  ipv4Details,
  mockRecords,
  permissionDetails,
  transformText,
  unflatten,
} from "@/lib/extended";
import {
  devopsReferences,
  webReferences,
  type ReferenceItem,
} from "@/data/references";
import { encodeValue, decodeValue } from "@/lib/security";
import { csvConvert } from "@/lib/converters";

export function ExtendedWorkspace({ id }: { id: ToolId }) {
  switch (id) {
    case "time":
      return <TimeTool />;
    case "diff":
      return <DiffTool />;
    case "schema":
      return <SchemaTool />;
    case "cron":
      return <CronTool />;
    case "mock":
      return <MockTool />;
    case "network-calc":
      return <NetworkTool />;
    case "security-headers":
      return <HeadersTool />;
    case "qr":
      return <QrTool />;
    case "image":
      return <ImageTool />;
    case "encoding-lab":
      return <EncodingLab />;
    case "crypto-lab":
      return <CryptoLab />;
    case "compression":
      return <CompressionTool />;
    case "text-lab":
      return <TextLab />;
    case "structured-data":
      return <StructuredTool />;
    case "permissions":
      return <PermissionsTool />;
    case "unicode-ref":
      return <UnicodeTool />;
    case "web-ref":
      return <ReferenceBook items={webReferences} />;
    case "devops-ref":
      return <ReferenceBook items={devopsReferences} />;
    case "pipeline":
      return <PipelineTool />;
    default:
      return null;
  }
}
const err = (e: unknown) => (e instanceof Error ? e.message : "Invalid input.");

function TimeTool() {
  const [input, setInput] = useState(() =>
      String(Math.floor(Date.now() / 1000)),
    ),
    [zone, setZone] = useState("UTC");
  let date: Date | null = null;
  try {
    const n = Number(input);
    date = new Date(
      Number.isFinite(n) ? (input.length <= 10 ? n * 1000 : n) : input,
    );
    if (Number.isNaN(date.getTime())) date = null;
  } catch {}
  const zones = [
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Dhaka",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
  return (
    <>
      <div className="toolbar">
        <label className="field grow">
          <span>Timestamp or date</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Unix seconds, milliseconds, or ISO date"
          />
        </label>
        <Select
          label="Time zone"
          value={zone}
          onChange={setZone}
          options={zones}
        />
        <button
          className="button secondary"
          onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
        >
          Now
        </button>
      </div>
      {!date ? (
        <ErrorBox message="Enter a valid Unix timestamp or date." />
      ) : (
        <div className="detail-grid">
          {[
            ["Unix seconds", Math.floor(date.getTime() / 1000)],
            ["Unix milliseconds", date.getTime()],
            ["ISO 8601", date.toISOString()],
            [
              zone,
              new Intl.DateTimeFormat("en-US", {
                dateStyle: "full",
                timeStyle: "long",
                timeZone: zone,
              }).format(date),
            ],
            ["Local", date.toLocaleString()],
            ["Relative", relative(date)],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <code>{v}</code>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function relative(d: Date) {
  const sec = Math.round((d.getTime() - Date.now()) / 1000),
    abs = Math.abs(sec);
  const [n, u] =
    abs < 60
      ? [sec, "second"]
      : abs < 3600
        ? [Math.round(sec / 60), "minute"]
        : abs < 86400
          ? [Math.round(sec / 3600), "hour"]
          : [Math.round(sec / 86400), "day"];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    n,
    u as Intl.RelativeTimeFormatUnit,
  );
}

function DiffTool() {
  const [a, setA] = useState(""),
    [b, setB] = useState(""),
    [mode, setMode] = useState("Text"),
    [error, setError] = useState("");
  const parts = useMemo(() => {
    try {
      setError("");
      return mode === "JSON"
        ? diffJson(JSON.parse(a || "null"), JSON.parse(b || "null"))
        : diffLines(a, b);
    } catch (e) {
      setError(err(e));
      return [];
    }
  }, [a, b, mode]);
  return (
    <>
      <div className="toolbar">
        <Select
          label="Compare as"
          value={mode}
          onChange={setMode}
          options={["Text", "JSON"]}
        />
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor label="Original" value={a} onChange={setA} />
        <Editor label="Changed" value={b} onChange={setB} />
      </div>
      <div className="diff-output">
        {parts.map((p, i) => (
          <span
            key={i}
            className={p.added ? "added" : p.removed ? "removed" : ""}
          >
            {p.value}
          </span>
        ))}
      </div>
    </>
  );
}

function SchemaTool() {
  const [data, setData] = useState(""),
    [schema, setSchema] = useState(""),
    [result, setResult] = useState(""),
    [error, setError] = useState("");
  function infer() {
    try {
      const s = JSON.stringify(inferSchema(JSON.parse(data)), null, 2);
      setSchema(s);
      setResult("Schema generated.");
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  function validate() {
    try {
      const ajv = new Ajv({ allErrors: true, strict: false });
      const ok = ajv.validate(JSON.parse(schema), JSON.parse(data));
      setResult(
        ok
          ? "Valid — the document matches the schema."
          : ajv.errorsText(ajv.errors, { separator: "\n" }),
      );
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <button className="button secondary" onClick={infer}>
          Infer schema
        </button>
        <button className="button primary" onClick={validate}>
          <Play size={15} /> Validate
        </button>
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor label="JSON document" value={data} onChange={setData} />
        <Editor label="JSON Schema" value={schema} onChange={setSchema} />
      </div>
      {result && <pre className="result-panel">{result}</pre>}
    </>
  );
}

function CronTool() {
  const [value, setValue] = useState("0 9 * * 1-5");
  let explanation = "";
  try {
    explanation = cronExplanation(value);
  } catch {}
  return (
    <>
      <label className="field">
        <span>Five-field cron expression</span>
        <input
          className="mono-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      {explanation ? (
        <div className="result-panel">
          <strong>{explanation}</strong>
          <div className="cron-fields">
            <span>minute</span>
            <span>hour</span>
            <span>day</span>
            <span>month</span>
            <span>weekday</span>
          </div>
          <div className="cron-fields values">
            {value.split(/\s+/).map((v, i) => (
              <code key={i}>{v}</code>
            ))}
          </div>
        </div>
      ) : (
        <ErrorBox message="Use five fields: minute hour day month weekday." />
      )}
      <div className="preset-row">
        {[
          ["Every 5 minutes", "*/5 * * * *"],
          ["Weekdays at 9", "0 9 * * 1-5"],
          ["Daily at midnight", "0 0 * * *"],
          ["Monthly", "0 0 1 * *"],
        ].map(([n, v]) => (
          <button key={n} onClick={() => setValue(v)}>
            {n}
          </button>
        ))}
      </div>
    </>
  );
}

function MockTool() {
  const [count, setCount] = useState(10),
    [seed, setSeed] = useState(42),
    [format, setFormat] = useState("JSON"),
    [output, setOutput] = useState("");
  function run() {
    const rows = mockRecords(count, seed);
    if (format === "JSON") setOutput(JSON.stringify(rows, null, 2));
    else if (format === "CSV") {
      const h = Object.keys(rows[0]);
      setOutput(
        [
          h.join(","),
          ...rows.map((r) =>
            h.map((k) => JSON.stringify(r[k as keyof typeof r])).join(","),
          ),
        ].join("\n"),
      );
    } else
      setOutput(
        rows
          .map(
            (r) =>
              `INSERT INTO users (id, name, email, active, score, created_at) VALUES (${[r.id, r.name, r.email, r.active, r.score, r.createdAt].map((v) => (typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v)).join(", ")});`,
          )
          .join("\n"),
      );
  }
  return (
    <>
      <div className="toolbar">
        <label className="field compact">
          <span>Records</span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(+e.target.value)}
          />
        </label>
        <label className="field compact">
          <span>Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(+e.target.value)}
          />
        </label>
        <Select
          label="Format"
          value={format}
          onChange={setFormat}
          options={["JSON", "CSV", "SQL"]}
        />
        <button className="button primary" onClick={run}>
          Generate
        </button>
      </div>
      <Editor label="Mock records" value={output} readOnly />
      <CopyButton value={output} />
    </>
  );
}

function NetworkTool() {
  const [ip, setIp] = useState("192.168.1.10"),
    [prefix, setPrefix] = useState(24);
  let d: ReturnType<typeof ipv4Details> | null = null;
  try {
    d = ipv4Details(ip, prefix);
  } catch {}
  return (
    <>
      <div className="toolbar">
        <label className="field">
          <span>IPv4 address</span>
          <input value={ip} onChange={(e) => setIp(e.target.value)} />
        </label>
        <label className="field compact">
          <span>CIDR prefix</span>
          <input
            type="number"
            min={0}
            max={32}
            value={prefix}
            onChange={(e) => setPrefix(+e.target.value)}
          />
        </label>
      </div>
      {d ? (
        <div className="detail-grid">
          {Object.entries(d).map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <code>{v}</code>
            </div>
          ))}
        </div>
      ) : (
        <ErrorBox message="Enter a valid IPv4 address and prefix from 0 to 32." />
      )}
    </>
  );
}

function HeadersTool() {
  const [input, setInput] = useState(""),
    [tab, setTab] = useState("Inspect");
  const headers = useMemo(
    () =>
      Object.fromEntries(
        input
          .split(/\r?\n/)
          .map((l) => {
            const i = l.indexOf(":");
            return i > 0
              ? [l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()]
              : null;
          })
          .filter(Boolean) as [string, string][],
      ),
    [input],
  );
  const checks = [
    ["content-security-policy", "Content Security Policy"],
    ["strict-transport-security", "HSTS"],
    ["x-content-type-options", "MIME sniffing protection"],
    ["referrer-policy", "Referrer policy"],
    ["permissions-policy", "Permissions policy"],
  ];
  return (
    <>
      <div className="toolbar">
        <Select
          label="Mode"
          value={tab}
          onChange={setTab}
          options={["Inspect", "CSP Builder"]}
        />
      </div>
      {tab === "Inspect" ? (
        <>
          <Editor
            label="Paste response headers"
            value={input}
            onChange={setInput}
          />
          <div className="check-list">
            {checks.map(([key, label]) => (
              <div key={key} className={headers[key] ? "ok" : "warn"}>
                <strong>{headers[key] ? "Present" : "Missing"}</strong>
                <span>{label}</span>
                <code>{headers[key] || key}</code>
              </div>
            ))}
          </div>
        </>
      ) : (
        <CspBuilder />
      )}
    </>
  );
}
function CspBuilder() {
  const [script, setScript] = useState(false),
    [image, setImage] = useState(true),
    [api, setApi] = useState(false);
  const value = `default-src 'self'; script-src 'self'${script ? " 'unsafe-inline'" : ""}; img-src 'self'${image ? " data:" : ""}; connect-src 'self'${api ? " https:" : ""}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`;
  return (
    <>
      <div className="option-list">
        <label>
          <input
            type="checkbox"
            checked={script}
            onChange={(e) => setScript(e.target.checked)}
          />{" "}
          Allow inline scripts (not recommended)
        </label>
        <label>
          <input
            type="checkbox"
            checked={image}
            onChange={(e) => setImage(e.target.checked)}
          />{" "}
          Allow data images
        </label>
        <label>
          <input
            type="checkbox"
            checked={api}
            onChange={(e) => setApi(e.target.checked)}
          />{" "}
          Allow HTTPS API connections
        </label>
      </div>
      <Editor label="Content-Security-Policy" value={value} readOnly rows={5} />
      <CopyButton value={value} />
    </>
  );
}

function QrTool() {
  const [text, setText] = useState(""),
    [kind, setKind] = useState("Text / URL"),
    [extra, setExtra] = useState(""),
    [dataUrl, setDataUrl] = useState(""),
    [decoded, setDecoded] = useState(""),
    [error, setError] = useState("");
  async function generate() {
    try {
      const content =
        kind === "Wi-Fi"
          ? `WIFI:T:WPA;S:${text};P:${extra};;`
          : kind === "Contact"
            ? `MECARD:N:${text};EMAIL:${extra};;`
            : text;
      setDataUrl(
        await QRCode.toDataURL(content, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        }),
      );
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  async function scan(file: File) {
    try {
      const bitmap = await createImageBitmap(file),
        canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height),
        code = jsQR(image.data, image.width, image.height);
      if (!code) throw new Error("No QR code found in this image.");
      setDecoded(code.data);
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <Select
          label="Content type"
          value={kind}
          onChange={setKind}
          options={["Text / URL", "Wi-Fi", "Contact"]}
        />
      </div>
      <Editor
        label={
          kind === "Wi-Fi"
            ? "Network name"
            : kind === "Contact"
              ? "Contact name"
              : "QR content"
        }
        value={text}
        onChange={setText}
        rows={4}
      />
      {kind !== "Text / URL" && (
        <label className="field">
          <span>{kind === "Wi-Fi" ? "Password" : "Email"}</span>
          <input value={extra} onChange={(e) => setExtra(e.target.value)} />
        </label>
      )}
      <div className="actions">
        <button className="button primary" onClick={generate}>
          Generate QR
        </button>
        <FileButton accept="image/*" onFile={scan} />
      </div>
      <ErrorBox message={error} />
      {dataUrl && (
        <div className="qr-result">
          <img src={dataUrl} alt="Generated QR code" />
          <a className="button secondary" href={dataUrl} download="qr-code.png">
            Download PNG
          </a>
        </div>
      )}
      {decoded && (
        <>
          <Editor label="Decoded content" value={decoded} readOnly rows={4} />
          <CopyButton value={decoded} />
        </>
      )}
    </>
  );
}

function ImageTool() {
  const [file, setFile] = useState<File | null>(null),
    [width, setWidth] = useState(0),
    [quality, setQuality] = useState(0.85),
    [format, setFormat] = useState("image/webp"),
    [output, setOutput] = useState(""),
    [info, setInfo] = useState(""),
    [average, setAverage] = useState("");
  async function load(f: File) {
    const bitmap = await createImageBitmap(f);
    setFile(f);
    setWidth(bitmap.width);
    setInfo(
      `${bitmap.width} × ${bitmap.height} · ${f.type || "unknown"} · ${(f.size / 1024).toFixed(1)} KB`,
    );
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext("2d")!;
    context.drawImage(bitmap, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let red = 0,
      green = 0,
      blue = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
    }
    const count = pixels.length / 4;
    setAverage(
      `#${[red / count, green / count, blue / count]
        .map((value) => Math.round(value).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()}`,
    );
  }
  async function convert() {
    if (!file) return;
    const bitmap = await createImageBitmap(file),
      ratio = width / bitmap.width,
      canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(bitmap.height * ratio);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    setOutput(canvas.toDataURL(format, quality));
  }
  return (
    <>
      <div className="toolbar">
        <FileButton accept="image/png,image/jpeg,image/webp" onFile={load} />
        {file && (
          <>
            <label className="field compact">
              <span>Width</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(+e.target.value)}
              />
            </label>
            <Select
              label="Format"
              value={format}
              onChange={setFormat}
              options={["image/webp", "image/png", "image/jpeg"]}
            />
            <label className="field compact">
              <span>Quality</span>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(+e.target.value)}
              />
            </label>
            <button className="button primary" onClick={convert}>
              Convert
            </button>
          </>
        )}
      </div>
      {info && (
        <div className="file-chip">
          {file?.name} · {info} · Average {average} · Export strips metadata
        </div>
      )}
      {output && (
        <div className="image-result">
          <img src={output} alt="Converted preview" />
          <a
            className="button secondary"
            href={output}
            download={`converted.${format.split("/")[1]}`}
          >
            Download
          </a>
          <CopyButton value={output} label="Copy data URL" />
        </div>
      )}
    </>
  );
}

function EncodingLab() {
  const [input, setInput] = useState(""),
    [output, setOutput] = useState(""),
    [mode, setMode] = useState("Text → HEX"),
    [error, setError] = useState("");
  function run() {
    try {
      const enc = new TextEncoder(),
        dec = new TextDecoder();
      let v = "";
      switch (mode) {
        case "Text → HEX":
          v = bytesToHex(enc.encode(input));
          break;
        case "HEX → Text":
          v = dec.decode(hexToBytes(input));
          break;
        case "Text → Binary":
          v = Array.from(enc.encode(input), (b) =>
            b.toString(2).padStart(8, "0"),
          ).join(" ");
          break;
        case "Binary → Text":
          v = dec.decode(
            Uint8Array.from(
              input
                .trim()
                .split(/\s+/)
                .map((x) => parseInt(x, 2)),
            ),
          );
          break;
        case "Base32 encode":
          v = base32Encode(input);
          break;
        case "Base32 decode":
          v = base32Decode(input);
          break;
        case "Base58 encode":
          v = base58Encode(input);
          break;
        case "Base58 decode":
          v = base58Decode(input);
          break;
        case "ROT13":
          v = transformText(input, "ROT13");
          break;
        default:
          v = input
            .split("")
            .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
            .join("");
      }
      setOutput(v);
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <Select
          label="Operation"
          value={mode}
          onChange={setMode}
          options={[
            "Text → HEX",
            "HEX → Text",
            "Text → Binary",
            "Binary → Text",
            "Base32 encode",
            "Base32 decode",
            "Base58 encode",
            "Base58 decode",
            "ROT13",
            "Unicode escape",
          ]}
        />
        <button className="button primary" onClick={run}>
          Convert
        </button>
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor label="Input" value={input} onChange={setInput} />
        <Editor label="Output" value={output} readOnly />
      </div>
      <CopyButton value={output} />
    </>
  );
}

function CryptoLab() {
  const [mode, setMode] = useState("Random secret"),
    [input, setInput] = useState(""),
    [key, setKey] = useState(""),
    [output, setOutput] = useState(""),
    [error, setError] = useState("");
  async function run() {
    try {
      const enc = new TextEncoder();
      if (mode === "Random secret") {
        setOutput(bytesToHex(crypto.getRandomValues(new Uint8Array(32))));
      } else if (mode === "HMAC SHA-256") {
        const k = await crypto.subtle.importKey(
          "raw",
          enc.encode(key),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        );
        setOutput(
          bytesToHex(
            new Uint8Array(
              await crypto.subtle.sign("HMAC", k, enc.encode(input)),
            ),
          ),
        );
      } else if (mode === "PKCE challenge") {
        const verifier =
          key || base64Url(crypto.getRandomValues(new Uint8Array(32)));
        const hash = await crypto.subtle.digest(
          "SHA-256",
          enc.encode(verifier),
        );
        setOutput(
          `Verifier: ${verifier}\nChallenge: ${base64Url(new Uint8Array(hash))}`,
        );
      } else if (mode === "SRI SHA-384") {
        const hash = await crypto.subtle.digest("SHA-384", enc.encode(input));
        setOutput(
          `sha384-${btoa(String.fromCharCode(...new Uint8Array(hash)))}`,
        );
      } else if (mode === "AES-GCM encrypt") {
        const raw = crypto.getRandomValues(new Uint8Array(32)),
          iv = crypto.getRandomValues(new Uint8Array(12)),
          k = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
            "encrypt",
          ]),
          cipher = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            k,
            enc.encode(input),
          );
        setOutput(
          JSON.stringify(
            {
              key: btoa(String.fromCharCode(...raw)),
              iv: btoa(String.fromCharCode(...iv)),
              ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipher))),
            },
            null,
            2,
          ),
        );
      } else if (mode === "AES-GCM decrypt") {
        const parsed = JSON.parse(input),
          raw = Uint8Array.from(atob(parsed.key), (c) => c.charCodeAt(0)),
          iv = Uint8Array.from(atob(parsed.iv), (c) => c.charCodeAt(0)),
          cipher = Uint8Array.from(atob(parsed.ciphertext), (c) =>
            c.charCodeAt(0),
          ),
          k = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
            "decrypt",
          ]),
          plain = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            k,
            cipher,
          );
        setOutput(new TextDecoder().decode(plain));
      } else if (mode === "RSA key pair" || mode === "ECDSA key pair") {
        const rsa = mode.startsWith("RSA"),
          pair = await crypto.subtle.generateKey(
            rsa
              ? {
                  name: "RSA-PSS",
                  modulusLength: 2048,
                  publicExponent: new Uint8Array([1, 0, 1]),
                  hash: "SHA-256",
                }
              : { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign", "verify"],
          ),
          pub = await crypto.subtle.exportKey("spki", pair.publicKey),
          priv = await crypto.subtle.exportKey("pkcs8", pair.privateKey),
          jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
        setOutput(
          `${pem("PUBLIC KEY", pub)}\n${pem("PRIVATE KEY", priv)}\nPublic JWK:\n${JSON.stringify(jwk, null, 2)}`,
        );
      } else {
        const match = input.match(/-----BEGIN ([^-]+)-----([\s\S]+?)-----END/);
        if (!match) throw new Error("Paste a PEM block.");
        const raw = Uint8Array.from(atob(match[2].replace(/\s/g, "")), (c) =>
            c.charCodeAt(0),
          ),
          hash = await crypto.subtle.digest("SHA-256", raw);
        setOutput(
          `Type: ${match[1]}\nDER bytes: ${raw.length}\nSHA-256 fingerprint: ${bytesToHex(new Uint8Array(hash)).match(/../g)?.join(":").toUpperCase()}`,
        );
      }
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <Select
          label="Operation"
          value={mode}
          onChange={setMode}
          options={[
            "Random secret",
            "HMAC SHA-256",
            "PKCE challenge",
            "SRI SHA-384",
            "AES-GCM encrypt",
            "AES-GCM decrypt",
            "RSA key pair",
            "ECDSA key pair",
            "PEM inspector",
          ]}
        />
        <button className="button primary" onClick={run}>
          Generate
        </button>
      </div>
      {!["Random secret", "RSA key pair", "ECDSA key pair"].includes(mode) && (
        <Editor
          label={mode === "PKCE challenge" ? "Optional verifier" : "Input"}
          value={input}
          onChange={setInput}
          rows={5}
        />
      )}{" "}
      {mode === "HMAC SHA-256" && (
        <label className="field">
          <span>Secret key</span>
          <input value={key} onChange={(e) => setKey(e.target.value)} />
        </label>
      )}
      <ErrorBox message={error} />
      <Editor label="Output" value={output} readOnly rows={6} />
      <CopyButton value={output} />
      <p className="tool-note">
        Generated keys remain in this browser tab. Store production keys in a
        dedicated secrets manager.
      </p>
    </>
  );
}
const base64Url = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const pem = (label: string, data: ArrayBuffer) => {
  const b = btoa(String.fromCharCode(...new Uint8Array(data))),
    lines = b.match(/.{1,64}/g)?.join("\n");
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
};

function CompressionTool() {
  const [input, setInput] = useState(""),
    [output, setOutput] = useState(""),
    [mode, setMode] = useState("gzip"),
    [action, setAction] = useState("Compress"),
    [error, setError] = useState("");
  async function run() {
    try {
      setOutput(
        action === "Compress"
          ? await compressText(input, mode as "gzip" | "deflate" | "zip")
          : await decompressText(input, mode as "gzip" | "deflate" | "zip"),
      );
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <Select
          label="Format"
          value={mode}
          onChange={setMode}
          options={["gzip", "deflate", "zip"]}
        />
        <Select
          label="Action"
          value={action}
          onChange={setAction}
          options={["Compress", "Decompress"]}
        />
        <button className="button primary" onClick={run}>
          Run
        </button>
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor
          label={action === "Compress" ? "Text" : "Base64 compressed data"}
          value={input}
          onChange={setInput}
        />
        <Editor
          label={action === "Compress" ? "Base64 compressed data" : "Text"}
          value={output}
          readOnly
        />
      </div>
      <CopyButton value={output} />
    </>
  );
}

function TextLab() {
  const [input, setInput] = useState(""),
    [output, setOutput] = useState(""),
    [operation, setOperation] = useState("UPPERCASE"),
    [fromBase, setFromBase] = useState(10),
    [toBase, setToBase] = useState(16),
    [error, setError] = useState("");
  function run() {
    try {
      let value = "";
      if (operation === "Number base")
        value = BigInt(parseInt(input, fromBase))
          .toString(toBase)
          .toUpperCase();
      else if (operation === "Semantic version compare") {
        const [a, b] = input.trim().split(/\s+/),
          pa = a.replace(/^v/, "").split(/[.-]/),
          pb = b.replace(/^v/, "").split(/[.-]/);
        let c = 0;
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          const x = Number(pa[i] ?? 0),
            y = Number(pb[i] ?? 0);
          if (x !== y) {
            c = x > y ? 1 : -1;
            break;
          }
        }
        value =
          c === 0
            ? `${a} equals ${b}`
            : c > 0
              ? `${a} is newer than ${b}`
              : `${b} is newer than ${a}`;
      } else if (operation === "Package name validator")
        value = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(
          input.trim(),
        )
          ? "Valid npm-style package name."
          : "Invalid: use lowercase letters, numbers, dots, underscores, and hyphens.";
      else if (operation === "CSV delimiter detector") {
        const first = input.split(/\r?\n/)[0] ?? "",
          choices = [",", ";", "\t", "|"],
          best = choices
            .map((d) => ({ d, count: first.split(d).length - 1 }))
            .sort((a, b) => b.count - a.count)[0];
        value = `Detected delimiter: ${best.d === "\t" ? "TAB" : best.d}`;
      } else if (operation === "Floating-point inspector") {
        const n = Number(input),
          buf = new ArrayBuffer(8);
        new DataView(buf).setFloat64(0, n);
        const bits = Array.from(new Uint8Array(buf), (b) =>
          b.toString(2).padStart(8, "0"),
        ).join("");
        value = `Value: ${n}\nSign: ${bits[0]}\nExponent: ${bits.slice(1, 12)}\nFraction: ${bits.slice(12)}\nHex: ${bytesToHex(new Uint8Array(buf)).toUpperCase()}\nSafe integer: ${Number.isSafeInteger(n)}`;
      } else if (operation === "Lorem ipsum")
        value =
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      else value = transformText(input, operation);
      setOutput(value);
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  const stats = new TextEncoder().encode(input).length;
  return (
    <>
      <div className="toolbar">
        <Select
          label="Operation"
          value={operation}
          onChange={setOperation}
          options={[
            "UPPERCASE",
            "lowercase",
            "Title Case",
            "camelCase",
            "snake_case",
            "kebab-case",
            "Slug",
            "Sort lines",
            "Deduplicate lines",
            "Reverse",
            "ROT13",
            "Number base",
            "Semantic version compare",
            "Package name validator",
            "CSV delimiter detector",
            "Floating-point inspector",
            "Lorem ipsum",
          ]}
        />
        {operation === "Number base" && (
          <>
            <label className="field compact">
              <span>From base</span>
              <input
                type="number"
                min={2}
                max={36}
                value={fromBase}
                onChange={(e) => setFromBase(+e.target.value)}
              />
            </label>
            <label className="field compact">
              <span>To base</span>
              <input
                type="number"
                min={2}
                max={36}
                value={toBase}
                onChange={(e) => setToBase(+e.target.value)}
              />
            </label>
          </>
        )}
        <button className="button primary" onClick={run}>
          Transform
        </button>
      </div>
      <div className="text-stats">
        <span>{input.length} characters</span>
        <span>{input.trim() ? input.trim().split(/\s+/).length : 0} words</span>
        <span>{stats} UTF-8 bytes</span>
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor label="Input" value={input} onChange={setInput} />
        <Editor label="Output" value={output} readOnly />
      </div>
      <CopyButton value={output} />
    </>
  );
}

function StructuredTool() {
  const [input, setInput] = useState(""),
    [output, setOutput] = useState(""),
    [mode, setMode] = useState("Flatten JSON"),
    [error, setError] = useState("");
  function run() {
    try {
      let value = "";
      if (mode === "Flatten JSON")
        value = JSON.stringify(flatten(JSON.parse(input)), null, 2);
      else if (mode === "Unflatten JSON")
        value = JSON.stringify(unflatten(JSON.parse(input)), null, 2);
      else if (mode === "Sort JSON keys")
        value = JSON.stringify(sortKeys(JSON.parse(input)), null, 2);
      else if (mode === "Format XML") {
        const doc = new DOMParser().parseFromString(input, "application/xml");
        if (doc.querySelector("parsererror"))
          throw new Error("Invalid XML document.");
        value = formatXml(new XMLSerializer().serializeToString(doc));
      } else if (mode === "JSONPath (dot path)") {
        const [path, ...rest] = input.split(/\r?\n/),
          data = JSON.parse(rest.join("\n"));
        value = JSON.stringify(
          path
            .split(".")
            .filter(Boolean)
            .reduce((v, k) => v?.[k], data),
          null,
          2,
        );
      } else if (mode === "XPath tester") {
        const [path, ...rest] = input.split(/\r?\n/),
          doc = new DOMParser().parseFromString(
            rest.join("\n"),
            "application/xml",
          );
        if (doc.querySelector("parsererror"))
          throw new Error("Invalid XML document.");
        const result = doc.evaluate(
            path,
            doc,
            null,
            XPathResult.ANY_TYPE,
            null,
          ),
          nodes = [];
        let node = result.iterateNext();
        while (node) {
          nodes.push(new XMLSerializer().serializeToString(node));
          node = result.iterateNext();
        }
        value = nodes.join("\n");
      } else if (mode === "Format HTML") value = formatXml(input);
      else if (
        mode === "Format CSS" ||
        mode === "Format JavaScript" ||
        mode === "Format GraphQL"
      )
        value = input
          .replace(/\s*([{};])\s*/g, "$1\n")
          .replace(/\n{2,}/g, "\n");
      else if (mode === "Markdown to HTML")
        value = input
          .split(/\r?\n/)
          .map((line) =>
            line.startsWith("### ")
              ? `<h3>${line.slice(4)}</h3>`
              : line.startsWith("## ")
                ? `<h2>${line.slice(3)}</h2>`
                : line.startsWith("# ")
                  ? `<h1>${line.slice(2)}</h1>`
                  : line.startsWith("- ")
                    ? `<li>${line.slice(2)}</li>`
                    : `<p>${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`,
          )
          .join("\n");
      else value = csvConvert(input, "Markdown");
      setOutput(value);
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <Select
          label="Operation"
          value={mode}
          onChange={setMode}
          options={[
            "Flatten JSON",
            "Unflatten JSON",
            "Sort JSON keys",
            "Format XML",
            "JSONPath (dot path)",
            "XPath tester",
            "Format HTML",
            "Format CSS",
            "Format JavaScript",
            "Format GraphQL",
            "Markdown to HTML",
            "CSV to Markdown",
          ]}
        />
        <button className="button primary" onClick={run}>
          Run
        </button>
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor
          label={
            mode.startsWith("JSONPath")
              ? "Path on first line, JSON below"
              : "Input"
          }
          value={input}
          onChange={setInput}
        />
        <Editor label="Output" value={output} readOnly />
      </div>
      <CopyButton value={output} />
    </>
  );
}
function sortKeys(v: unknown): unknown {
  return Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v as Record<string, unknown>)
            .sort()
            .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]),
        )
      : v;
}
function formatXml(xml: string) {
  let depth = 0;
  return xml
    .replace(/>\s*</g, "><")
    .replace(/</g, "\n<")
    .trim()
    .split("\n")
    .map((line) => {
      if (/^<\//.test(line)) depth--;
      const out = "  ".repeat(Math.max(depth, 0)) + line;
      if (/^<[^!?/][^>]*[^/]?>$/.test(line) && !line.includes("</")) depth++;
      return out;
    })
    .join("\n");
}

function PermissionsTool() {
  const [value, setValue] = useState("755");
  let d: ReturnType<typeof permissionDetails> | null = null;
  try {
    d = permissionDetails(value);
  } catch {}
  return (
    <>
      <label className="field compact">
        <span>Octal mode</span>
        <input
          className="mono-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      {d ? (
        <>
          <div className="permission-symbol">{d.symbolic}</div>
          <div className="detail-grid">
            {[
              ["Owner", d.owner],
              ["Group", d.group],
              ["Others", d.others],
              ["Special bits", d.special],
              ["Command", d.command],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <code>{v}</code>
              </div>
            ))}
          </div>
          <CopyButton value={d.command} />
        </>
      ) : (
        <ErrorBox message="Enter an octal mode such as 644, 755, or 4755." />
      )}
    </>
  );
}

function UnicodeTool() {
  const [input, setInput] = useState("");
  const chars = Array.from(input)
    .slice(0, 200)
    .map((c) => {
      const cp = c.codePointAt(0)!;
      return {
        char: c,
        code: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
        decimal: `&#${cp};`,
        hex: `&#x${cp.toString(16).toUpperCase()};`,
        js:
          cp <= 0xffff
            ? `\\u${cp.toString(16).padStart(4, "0")}`
            : `\\u{${cp.toString(16)}}`,
        utf8: bytesToHex(new TextEncoder().encode(c))
          .match(/../g)
          ?.join(" ")
          .toUpperCase(),
      };
    });
  return (
    <>
      <Editor
        label="Text or emoji"
        value={input}
        onChange={setInput}
        rows={5}
      />
      <div className="unicode-grid">
        {chars.map((c, i) => (
          <article key={i}>
            <strong>{/\s/.test(c.char) ? "Whitespace" : c.char}</strong>
            <code>{c.code}</code>
            <span>UTF-8 {c.utf8}</span>
            <span>{c.js}</span>
            <span>{c.hex}</span>
            <CopyButton value={c.char} />
          </article>
        ))}
      </div>
    </>
  );
}

function ReferenceBook({ items }: { items: ReferenceItem[] }) {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("All");
  const groups = ["All", ...new Set(items.map((i) => i.group))],
    shown = items.filter(
      (i) =>
        (group === "All" || i.group === group) &&
        `${i.key} ${i.title} ${i.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <>
      <div className="toolbar">
        <label className="field grow">
          <span>Search reference</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, number, or purpose"
          />
        </label>
        <Select
          label="Section"
          value={group}
          onChange={setGroup}
          options={groups}
        />
      </div>
      <div className="reference-list">
        {shown.map((i, n) => (
          <article key={`${i.title}-${n}`}>
            <small>{i.group}</small>
            <h3>{i.title}</h3>
            <p>{i.description}</p>
            {i.example && (
              <div className="reference-code">
                <code>{i.example}</code>
                <CopyButton value={i.example} />
              </div>
            )}
            {i.security && (
              <p className="security-note">Security: {i.security}</p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

const pipelineOps = [
  "URL encode",
  "URL decode",
  "Base64 encode",
  "Base64 decode",
  "UPPERCASE",
  "lowercase",
  "Trim",
  "JSON format",
  "JSON minify",
  "ROT13",
];
function PipelineTool() {
  const [input, setInput] = useState(""),
    [steps, setSteps] = useState<string[]>(["URL decode"]),
    [output, setOutput] = useState(""),
    [error, setError] = useState("");
  const detected = !input
    ? "Waiting for input"
    : (() => {
        try {
          JSON.parse(input);
          return "JSON";
        } catch {
          return /^[A-Za-z0-9+/]+=*$/.test(input.trim())
            ? "Possible Base64"
            : /%[0-9a-f]{2}/i.test(input)
              ? "URL-encoded text"
              : "Plain text";
        }
      })();
  function run() {
    try {
      let v = input;
      for (const op of steps) {
        if (op === "URL encode") v = encodeValue(v, "URL");
        else if (op === "URL decode") v = decodeValue(v, "URL");
        else if (op === "Base64 encode") v = encodeValue(v, "Base64");
        else if (op === "Base64 decode") v = decodeValue(v, "Base64");
        else if (op === "Trim") v = v.trim();
        else if (op === "JSON format")
          v = JSON.stringify(JSON.parse(v), null, 2);
        else if (op === "JSON minify") v = JSON.stringify(JSON.parse(v));
        else v = transformText(v, op);
      }
      setOutput(v);
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  function exportRecipe() {
    const value = JSON.stringify({ version: 1, steps }, null, 2);
    navigator.clipboard.writeText(value);
  }
  async function importRecipe(file: File) {
    try {
      const recipe = JSON.parse(await file.text());
      if (
        !Array.isArray(recipe.steps) ||
        recipe.steps.some(
          (step: unknown) => !pipelineOps.includes(String(step)),
        )
      )
        throw new Error("Invalid recipe file.");
      setSteps(recipe.steps);
      setError("");
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <>
      <Editor label="Input" value={input} onChange={setInput} rows={6} />
      <div className="text-stats">
        <span>Detected: {detected}</span>
      </div>
      <div className="pipeline-steps">
        {steps.map((step, i) => (
          <div key={i}>
            <span>{i + 1}</span>
            <Select
              label="Operation"
              value={step}
              onChange={(v) =>
                setSteps((s) => s.map((x, n) => (n === i ? v : x)))
              }
              options={pipelineOps}
            />
            <button
              className="icon-button"
              aria-label="Remove step"
              onClick={() => setSteps((s) => s.filter((_, n) => n !== i))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="actions">
        <button
          className="button secondary"
          onClick={() => setSteps((s) => [...s, "URL encode"])}
        >
          <Plus size={15} /> Add step
        </button>
        <button className="button secondary" onClick={exportRecipe}>
          Copy recipe
        </button>
        <FileButton accept="application/json,.json" onFile={importRecipe} />
        <button
          className="button secondary"
          onClick={() =>
            localStorage.setItem("devkit-pipeline", JSON.stringify(steps))
          }
        >
          Save locally
        </button>
        <button
          className="button secondary"
          onClick={() => {
            const saved = localStorage.getItem("devkit-pipeline");
            if (saved) setSteps(JSON.parse(saved));
          }}
        >
          Load local
        </button>
        <button className="button primary" onClick={run}>
          Run pipeline
        </button>
      </div>
      <ErrorBox message={error} />
      <Editor label="Output" value={output} readOnly rows={6} />
      <CopyButton value={output} />
    </>
  );
}
