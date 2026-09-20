"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Play, RefreshCw } from "lucide-react";
import { format as formatSql } from "sql-formatter";
import type { ToolId } from "@/types";
import {
  convertConfig,
  csvConvert,
  envToJson,
  jsonToEnv,
  type ConfigFormat,
} from "@/lib/converters";
import { curlToCode, securityContext, statusCodes } from "@/lib/network";
import {
  decodeValue,
  encodeValue,
  hashData,
  inspectJwt,
  textBuffer,
} from "@/lib/security";
import { colorDetails, contrast, parseColor, ulid } from "@/lib/generators";
import {
  CopyButton,
  DownloadButton,
  Editor,
  ErrorBox,
  FileButton,
  Select,
} from "./ToolUI";

const samples: Partial<Record<ToolId, string>> = {
  config: "",
  env: "",
  csv: "",
  encoder: "",
  jwt: "",
  formatter: "",
  regex: "",
  curl: "",
  url: "",
  color: "#6366F1",
};

const webSafeColors = ["00", "33", "66", "99", "CC", "FF"].flatMap((red) =>
  ["00", "33", "66", "99", "CC", "FF"].flatMap((green) =>
    ["00", "33", "66", "99", "CC", "FF"].map((blue) => {
      const hex = `#${red}${green}${blue}`;
      const rgb = [red, green, blue].map((value) => parseInt(value, 16));
      const max = Math.max(...rgb);
      const min = Math.min(...rgb);
      let family = "Neutral";
      if (max !== min) {
        const [r, g, b] = rgb;
        if (r === max && g >= b) family = g > r * 0.7 ? "Yellow" : "Red";
        else if (r === max) family = b > r * 0.7 ? "Purple" : "Red";
        else if (g === max && b >= r) family = b > g * 0.7 ? "Cyan" : "Green";
        else if (g === max) family = r > g * 0.7 ? "Yellow" : "Green";
        else if (r > b * 0.7) family = "Purple";
        else family = "Blue";
      }
      return { hex, rgb: `rgb(${rgb.join(", ")})`, family };
    }),
  ),
);

export function ToolWorkspace({ id }: { id: ToolId }) {
  if (id === "config") return <ConfigTool />;
  if (id === "env") return <EnvTool />;
  if (id === "csv") return <CsvTool />;
  if (id === "encoder") return <EncoderTool />;
  if (id === "jwt") return <JwtTool />;
  if (id === "hash") return <HashTool />;
  if (id === "formatter") return <FormatterTool />;
  if (id === "regex") return <RegexTool />;
  if (id === "curl") return <CurlTool />;
  if (id === "url") return <UrlTool />;
  if (id === "status") return <StatusTool />;
  if (id === "uuid") return <IdTool />;
  if (id === "hex-library") return <HexLibraryTool />;
  return <ColorTool />;
}

function Transform({
  input,
  setInput,
  output,
  error,
  run,
  children,
}: {
  input: string;
  setInput: (s: string) => void;
  output: string;
  error: string;
  run: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="toolbar">
        {children}
        <button className="button primary" onClick={run}>
          <Play size={15} /> Transform
        </button>
      </div>
      <ErrorBox message={error} />
      <div className="editor-grid">
        <Editor label="Input" value={input} onChange={setInput} />
        <Editor label="Output" value={output} readOnly />
      </div>
      <div className="actions">
        <CopyButton value={output} />
        <DownloadButton value={output} filename="devkitcircle-output.txt" />
      </div>
    </>
  );
}
function useTransform(initial: string) {
  const [input, setInput] = useState(initial),
    [output, setOutput] = useState(""),
    [error, setError] = useState("");
  const exec = (fn: () => string) => {
    try {
      setOutput(fn());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      setOutput("");
    }
  };
  return { input, setInput, output, error, exec };
}

function ConfigTool() {
  const s = useTransform(samples.config!);
  const [from, setFrom] = useState<ConfigFormat>("JSON"),
    [to, setTo] = useState<ConfigFormat>("YAML");
  return (
    <Transform
      {...s}
      run={() => s.exec(() => convertConfig(s.input, from, to))}
    >
      <Select
        label="From"
        value={from}
        onChange={(v) => setFrom(v as ConfigFormat)}
        options={["JSON", "YAML", "TOML"]}
      />
      <button
        className="icon-button"
        title="Swap formats"
        onClick={() => {
          const x = from;
          setFrom(to);
          setTo(x);
          s.setInput(s.output);
        }}
      >
        <ArrowLeftRight size={17} />
      </button>
      <Select
        label="To"
        value={to}
        onChange={(v) => setTo(v as ConfigFormat)}
        options={["JSON", "YAML", "TOML"]}
      />
    </Transform>
  );
}
function EnvTool() {
  const s = useTransform(samples.env!);
  const [mode, setMode] = useState("ENV to JSON");
  return (
    <Transform
      {...s}
      run={() =>
        s.exec(() =>
          mode === "ENV to JSON" ? envToJson(s.input) : jsonToEnv(s.input),
        )
      }
    >
      <Select
        label="Conversion"
        value={mode}
        onChange={setMode}
        options={["ENV to JSON", "JSON to ENV"]}
      />
    </Transform>
  );
}
function CsvTool() {
  const s = useTransform(samples.csv!);
  const [target, setTarget] = useState("JSON");
  return (
    <Transform
      {...s}
      run={() =>
        s.exec(() => csvConvert(s.input, target as "JSON" | "Markdown"))
      }
    >
      <Select
        label="Output"
        value={target}
        onChange={setTarget}
        options={["JSON", "Markdown"]}
      />
      <FileButton
        accept=".csv,text/csv"
        onFile={async (f) => s.setInput(await f.text())}
      />
    </Transform>
  );
}
function EncoderTool() {
  const s = useTransform(samples.encoder!);
  const [type, setType] = useState("Base64"),
    [action, setAction] = useState("Encode");
  return (
    <Transform
      {...s}
      run={() =>
        s.exec(() =>
          (action === "Encode" ? encodeValue : decodeValue)(
            s.input,
            type as "Base64" | "URL" | "HTML",
          ),
        )
      }
    >
      <Select
        label="Type"
        value={type}
        onChange={setType}
        options={["Base64", "URL", "HTML"]}
      />
      <Select
        label="Action"
        value={action}
        onChange={setAction}
        options={["Encode", "Decode"]}
      />
    </Transform>
  );
}
function JwtTool() {
  const [input, setInput] = useState(samples.jwt!),
    [error, setError] = useState("");
  const data = useMemo(() => {
    try {
      setError("");
      return inspectJwt(input);
    } catch {
      return null;
    }
  }, [input]);
  useEffect(() => {
    if (!data && input) setError("Invalid JWT encoding or JSON payload.");
  }, [data, input]);
  return (
    <>
      <Editor
        label="JWT token (decoded locally; signature is not verified)"
        value={input}
        onChange={setInput}
        rows={5}
      />
      <ErrorBox message={error} />
      {data && (
        <>
          <div className={`jwt-status ${data.expired ? "bad" : "good"}`}>
            {data.expiry
              ? `${data.expired ? "Expired" : "Valid expiry"}: ${data.expiry.toLocaleString()}`
              : "No expiration claim"}
          </div>
          <div className="editor-grid">
            <Editor
              label="Header"
              value={JSON.stringify(data.header, null, 2)}
              readOnly
            />
            <Editor
              label="Payload"
              value={JSON.stringify(data.payload, null, 2)}
              readOnly
            />
          </div>
        </>
      )}
    </>
  );
}
function HashTool() {
  const [text, setText] = useState(""),
    [algo, setAlgo] = useState("SHA-256"),
    [result, setResult] = useState(""),
    [file, setFile] = useState<File | null>(null);
  async function run() {
    setResult(
      await hashData(
        file ? await file.arrayBuffer() : textBuffer(text),
        algo as "MD5" | "SHA-1" | "SHA-256" | "SHA-512",
      ),
    );
  }
  return (
    <>
      <div className="toolbar">
        <Select
          label="Algorithm"
          value={algo}
          onChange={setAlgo}
          options={["SHA-256", "SHA-512", "SHA-1", "MD5"]}
        />
        <FileButton onFile={setFile} />
        <button className="button primary" onClick={run}>
          <Play size={15} /> Generate hash
        </button>
      </div>
      {file ? (
        <div className="file-chip">
          {file.name} · {file.size.toLocaleString()} bytes{" "}
          <button onClick={() => setFile(null)}>Remove</button>
        </div>
      ) : (
        <Editor label="Text" value={text} onChange={setText} rows={7} />
      )}
      <Editor label="Hash" value={result} readOnly rows={4} />
      <CopyButton value={result} />
    </>
  );
}
function FormatterTool() {
  const s = useTransform(samples.formatter!);
  const [type, setType] = useState("JSON"),
    [action, setAction] = useState("Format");
  return (
    <Transform
      {...s}
      run={() =>
        s.exec(() => {
          if (type === "JSON") {
            const p = JSON.parse(s.input);
            return action === "Format"
              ? JSON.stringify(p, null, 2)
              : JSON.stringify(p);
          }
          return action === "Format"
            ? formatSql(s.input, { language: "sql" })
            : formatSql(s.input, {
                language: "sql",
                keywordCase: "preserve",
                linesBetweenQueries: 0,
              })
                .replace(/\s+/g, " ")
                .trim();
        })
      }
    >
      <Select
        label="Language"
        value={type}
        onChange={setType}
        options={["JSON", "SQL"]}
      />
      <Select
        label="Action"
        value={action}
        onChange={setAction}
        options={["Format", "Minify"]}
      />
    </Transform>
  );
}
function RegexTool() {
  const [pattern, setPattern] = useState("[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}"),
    [flags, setFlags] = useState("gi"),
    [text, setText] = useState(samples.regex!),
    [error, setError] = useState("");
  const matches = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      setError("");
      return Array.from(text.matchAll(re)).map((m, i) => ({
        number: i + 1,
        value: m[0],
        index: m.index ?? 0,
        groups: m.slice(1),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid expression");
      return [];
    }
  }, [pattern, flags, text]);
  return (
    <>
      <div className="regex-row">
        <label className="field grow">
          <span>Expression</span>
          <div className="regex-input">
            <i>/</i>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
            <i>/</i>
            <input
              className="flags"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              aria-label="Regex flags"
            />
          </div>
        </label>
      </div>
      <ErrorBox message={error} />
      <Editor label="Test string" value={text} onChange={setText} />
      <div className="results-head">
        <strong>
          {matches.length} match{matches.length === 1 ? "" : "es"}
        </strong>
      </div>
      <div className="match-list">
        {matches.map((m) => (
          <div key={`${m.index}-${m.number}`}>
            <code>{m.value}</code>
            <span>
              index {m.index}
              {m.groups.length ? ` · ${m.groups.length} capture groups` : ""}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
function CurlTool() {
  const s = useTransform(samples.curl!);
  const [target, setTarget] = useState("Fetch");
  return (
    <Transform
      {...s}
      run={() =>
        s.exec(() =>
          curlToCode(s.input, target as "Fetch" | "Axios" | "Python" | "Go"),
        )
      }
    >
      <Select
        label="Target"
        value={target}
        onChange={setTarget}
        options={["Fetch", "Axios", "Python", "Go"]}
      />
    </Transform>
  );
}
function UrlTool() {
  const [input, setInput] = useState(samples.url!),
    [error, setError] = useState("");
  const data = useMemo(() => {
    try {
      const url = new URL(input);
      setError("");
      return url;
    } catch {
      return null;
    }
  }, [input]);
  useEffect(() => {
    if (!data && input)
      setError("Enter a complete URL including https:// or http://.");
  }, [data, input]);
  return (
    <>
      <Editor label="URL" value={input} onChange={setInput} rows={4} />
      <ErrorBox message={error} />
      {data && (
        <>
          <div className="detail-grid">
            {[
              ["Protocol", data.protocol],
              ["Host", data.host],
              ["Path", data.pathname],
              ["Hash", data.hash || "—"],
              ["Origin", data.origin],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <code>{v}</code>
              </div>
            ))}
          </div>
          <h3>Query parameters</h3>
          <div className="param-table">
            <div>
              <strong>Key</strong>
              <strong>Value</strong>
            </div>
            {Array.from(data.searchParams.entries()).map(([k, v], i) => (
              <div key={`${k}-${i}`}>
                <code>{k}</code>
                <code>{v}</code>
              </div>
            ))}
            {!data.search && <p>No query parameters.</p>}
          </div>
        </>
      )}
    </>
  );
}
function StatusTool() {
  const [query, setQuery] = useState("");
  const filtered = statusCodes.filter(([code, name, description]) =>
    `${code} ${name} ${description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <label className="field">
        <span>Search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Code or description"
        />
      </label>
      <div className="status-list">
        {filtered.map(([code, name, description]) => (
          <article key={code}>
            <div className="status-number">{code}</div>
            <div>
              <h3>{name}</h3>
              <p>{description}</p>
              <small>
                <b>Security:</b> {securityContext(code)}
              </small>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function IdTool() {
  const [type, setType] = useState("UUID v4"),
    [count, setCount] = useState(5),
    [output, setOutput] = useState("");
  const generate = useCallback(() => {
    setOutput(
      Array.from({ length: Math.min(100, Math.max(1, count)) }, () =>
        type === "UUID v4" ? crypto.randomUUID() : ulid(),
      ).join("\n"),
    );
  }, [count, type]);
  useEffect(() => {
    generate();
  }, [generate]);
  return (
    <>
      <div className="toolbar">
        <Select
          label="Identifier"
          value={type}
          onChange={setType}
          options={["UUID v4", "ULID"]}
        />
        <label className="field compact">
          <span>Count (max 100)</span>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(+e.target.value)}
          />
        </label>
        <button className="button primary" onClick={generate}>
          <RefreshCw size={15} /> Generate
        </button>
      </div>
      <Editor label="Generated identifiers" value={output} readOnly />
      <div className="actions">
        <CopyButton value={output} />
        <DownloadButton
          value={output}
          filename={`${type.toLowerCase().replace(" ", "-")}.txt`}
        />
      </div>
    </>
  );
}
function ColorTool() {
  const [foreground, setForeground] = useState(samples.color!),
    [background, setBackground] = useState("#0D1117"),
    [error, setError] = useState("");
  const data = useMemo(() => {
    try {
      const fg = parseColor(foreground),
        bg = parseColor(background);
      setError("");
      return {
        fg,
        bg,
        fd: colorDetails(fg),
        bd: colorDetails(bg),
        ratio: contrast(fg, bg),
      };
    } catch {
      return null;
    }
  }, [foreground, background]);
  useEffect(() => {
    if (!data) setError("Enter valid HEX, RGB, or HSL colors.");
  }, [data]);
  return (
    <>
      <div className="color-fields">
        <label className="field">
          <span>Foreground</span>
          <input
            value={foreground}
            onChange={(e) => setForeground(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Background</span>
          <input
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />
        </label>
      </div>
      <ErrorBox message={error} />
      {data && (
        <>
          <div
            className="contrast-preview"
            style={{ color: data.fd.hex, background: data.bd.hex }}
          >
            <strong>Sample text</strong>
            <span>Contrast preview</span>
          </div>
          <div className="contrast-score">
            <div>
              <strong>{data.ratio.toFixed(2)}:1</strong>
              <span>Contrast ratio</span>
            </div>
            {[
              ["AA normal", data.ratio >= 4.5],
              ["AA large", data.ratio >= 3],
              ["AAA normal", data.ratio >= 7],
              ["AAA large", data.ratio >= 4.5],
            ].map(([label, pass]) => (
              <span className={pass ? "pass" : "fail"} key={String(label)}>
                {pass ? "Pass" : "Fail"} {label}
              </span>
            ))}
          </div>
          <div className="detail-grid">
            {[
              ["Foreground HEX", data.fd.hex],
              ["Foreground RGB", data.fd.rgb],
              ["Foreground HSL", data.fd.hsl],
              ["Background HEX", data.bd.hex],
              ["Background RGB", data.bd.rgb],
              ["Background HSL", data.bd.hsl],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <code>{v}</code>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function HexLibraryTool() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(webSafeColors[0]);
  const normalizedQuery = query.trim().toLowerCase();
  const colors = webSafeColors.filter((color) =>
    `${color.hex} ${color.rgb} ${color.family}`
      .toLowerCase()
      .includes(normalizedQuery),
  );

  return (
    <>
      <div className="hex-library-toolbar">
        <label className="field grow">
          <span>Search by HEX, RGB, or color family</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="#3366FF, rgb(51, 102, 255), or Blue"
          />
        </label>
        <span className="hex-result-count">{colors.length} colors</span>
      </div>

      <div className="selected-color">
        <span
          className="selected-color-swatch"
          style={{ background: selected.hex }}
        />
        <div>
          <strong>{selected.hex}</strong>
          <span>
            {selected.rgb} · {selected.family}
          </span>
        </div>
        <CopyButton value={selected.hex} label="Copy HEX" />
      </div>

      {colors.length ? (
        <div className="hex-color-grid">
          {colors.map((color) => (
            <button
              key={color.hex}
              className={selected.hex === color.hex ? "selected" : ""}
              onClick={() => setSelected(color)}
              title={`${color.hex} · ${color.rgb}`}
              aria-label={`Select ${color.hex}`}
            >
              <span style={{ background: color.hex }} />
              <code>{color.hex}</code>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty compact-empty">
          <h3>No colors found</h3>
          <p>Search with a full or partial HEX, RGB value, or color family.</p>
        </div>
      )}
      <p className="hex-library-note">
        Web-safe colors use six evenly spaced values per RGB channel, creating
        216 colors that render consistently across displays.
      </p>
    </>
  );
}
