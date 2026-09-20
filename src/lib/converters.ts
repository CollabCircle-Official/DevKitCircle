import * as yaml from "js-yaml";
import * as TOML from "@iarna/toml";
import Papa from "papaparse";

export type ConfigFormat = "JSON" | "YAML" | "TOML";

export function convertConfig(
  input: string,
  from: ConfigFormat,
  to: ConfigFormat,
): string {
  let value: unknown;
  if (from === "JSON") value = JSON.parse(input);
  else if (from === "YAML") value = yaml.load(input);
  else value = TOML.parse(input);
  if (to === "JSON") return JSON.stringify(value, null, 2);
  if (to === "YAML")
    return yaml.dump(value, { indent: 2, noRefs: true, lineWidth: 100 });
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("TOML requires a top-level object.");
  return TOML.stringify(value as TOML.JsonMap);
}

export function envToJson(input: string): string {
  const result: Record<string, string> = {};
  input.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][\w.]*)\s*=\s*(.*)$/);
    if (!match) throw new Error(`Invalid ENV syntax on line ${index + 1}.`);
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    result[match[1]] = value.replace(/\\n/g, "\n");
  });
  return JSON.stringify(result, null, 2);
}

export function jsonToEnv(input: string): string {
  const parsed = JSON.parse(input) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Expected a JSON object.");
  return Object.entries(parsed)
    .map(([key, value]) => {
      if (!/^[A-Za-z_][\w.]*$/.test(key))
        throw new Error(`Invalid environment key: ${key}`);
      const text = typeof value === "string" ? value : JSON.stringify(value);
      return `${key}=${JSON.stringify(text).replace(/\\n/g, "\\\\n")}`;
    })
    .join("\n");
}

export function csvConvert(input: string, target: "JSON" | "Markdown"): string {
  const parsed = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message);
  if (!parsed.meta.fields?.length)
    throw new Error("CSV must contain a header row.");
  if (target === "JSON") return JSON.stringify(parsed.data, null, 2);
  const fields = parsed.meta.fields;
  const escape = (v: unknown) =>
    String(v ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, " ");
  return [
    `| ${fields.map(escape).join(" | ")} |`,
    `| ${fields.map(() => "---").join(" | ")} |`,
    ...parsed.data.map(
      (row) => `| ${fields.map((f) => escape(row[f])).join(" | ")} |`,
    ),
  ].join("\n");
}
