"use client";

import { Check, Copy, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { copyText, downloadText } from "@/lib/common";

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  label: string;
}) {
  return (
    <label className="field select-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
export function Editor({
  value,
  onChange,
  label,
  placeholder,
  readOnly = false,
  rows = 12,
}: {
  value: string;
  onChange?: (v: string) => void;
  label: string;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
}) {
  return (
    <label className="editor">
      <span>{label}</span>
      <textarea
        spellCheck={false}
        rows={rows}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </label>
  );
}
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="button secondary"
      disabled={!value}
      onClick={async () => {
        await copyText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check size={15} /> : <Copy size={15} />}{" "}
      {done ? "Copied" : label}
    </button>
  );
}
export function DownloadButton({
  value,
  filename,
}: {
  value: string;
  filename: string;
}) {
  return (
    <button
      className="button secondary"
      disabled={!value}
      onClick={() => downloadText(value, filename)}
    >
      <Download size={15} /> Download
    </button>
  );
}
export function FileButton({
  onFile,
  accept,
}: {
  onFile: (f: File) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button className="button secondary" onClick={() => ref.current?.click()}>
        <Upload size={15} /> Local file
      </button>
      <input
        ref={ref}
        hidden
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div className="error" role="alert">
      {message}
    </div>
  ) : null;
}
