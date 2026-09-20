export interface CurlRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: string;
}

export function parseCurl(input: string): CurlRequest {
  const tokens =
    input
      .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
      ?.map((t) => t.replace(/^(['"])(.*)\1$/, "$2")) ?? [];
  if (tokens[0]?.toLowerCase() !== "curl")
    throw new Error("Command must start with curl.");
  const result: CurlRequest = { url: "", method: "GET", headers: {} };
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (["-X", "--request"].includes(token))
      result.method = (tokens[++i] || "GET").toUpperCase();
    else if (["-H", "--header"].includes(token)) {
      const h = tokens[++i] || "";
      const p = h.indexOf(":");
      if (p > 0) result.headers[h.slice(0, p).trim()] = h.slice(p + 1).trim();
    } else if (
      ["-d", "--data", "--data-raw", "--data-binary"].includes(token)
    ) {
      result.data = tokens[++i] || "";
      if (result.method === "GET") result.method = "POST";
    } else if (!token.startsWith("-") && /^https?:\/\//.test(token))
      result.url = token;
  }
  if (!result.url) throw new Error("No HTTP(S) URL found in the curl command.");
  return result;
}

export function curlToCode(
  input: string,
  target: "Fetch" | "Axios" | "Python" | "Go",
): string {
  const r = parseCurl(input);
  const headers = JSON.stringify(r.headers, null, 2);
  const body = r.data ? `,\n  body: ${JSON.stringify(r.data)}` : "";
  if (target === "Fetch")
    return `const response = await fetch(${JSON.stringify(r.url)}, {\n  method: ${JSON.stringify(r.method)},\n  headers: ${headers.replace(/\n/g, "\n  ")}${body}\n});\n\nconst data = await response.json();`;
  if (target === "Axios")
    return `import axios from "axios";\n\nconst response = await axios({\n  url: ${JSON.stringify(r.url)},\n  method: ${JSON.stringify(r.method.toLowerCase())},\n  headers: ${headers.replace(/\n/g, "\n  ")}${r.data ? `,\n  data: ${JSON.stringify(r.data)}` : ""}\n});`;
  if (target === "Python")
    return `import requests\n\nresponse = requests.request(\n    ${JSON.stringify(r.method)},\n    ${JSON.stringify(r.url)},\n    headers=${JSON.stringify(r.headers)}${r.data ? `,\n    data=${JSON.stringify(r.data)}` : ""}\n)\nprint(response.json())`;
  const headerLines = Object.entries(r.headers)
    .map(
      ([k, v]) => `req.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`,
    )
    .join("\n");
  return `package main\n\nimport (\n  "fmt"\n  "net/http"${r.data ? '\n  "strings"' : ""}\n)\n\nfunc main() {\n  req, _ := http.NewRequest(${JSON.stringify(r.method)}, ${JSON.stringify(r.url)}, ${r.data ? `strings.NewReader(${JSON.stringify(r.data)})` : "nil"})\n  ${headerLines}\n  response, err := http.DefaultClient.Do(req)\n  fmt.Println(response, err)\n}`;
}

export const statusCodes = [
  [100, "Continue", "The client may continue the request."],
  [200, "OK", "The request succeeded."],
  [201, "Created", "A new resource was created."],
  [204, "No Content", "Success with no response body."],
  [301, "Moved Permanently", "The resource has a permanent new URL."],
  [302, "Found", "Temporary redirect."],
  [304, "Not Modified", "Use the cached representation."],
  [400, "Bad Request", "Malformed or invalid request."],
  [401, "Unauthorized", "Authentication is required or invalid."],
  [403, "Forbidden", "Authenticated but not authorized."],
  [404, "Not Found", "The resource does not exist."],
  [405, "Method Not Allowed", "HTTP method is unsupported."],
  [408, "Request Timeout", "The server timed out waiting."],
  [409, "Conflict", "Request conflicts with current state."],
  [413, "Content Too Large", "Request body exceeds limits."],
  [415, "Unsupported Media Type", "Payload format is unsupported."],
  [422, "Unprocessable Content", "Semantically invalid content."],
  [429, "Too Many Requests", "Rate limit exceeded."],
  [500, "Internal Server Error", "Unexpected server failure."],
  [501, "Not Implemented", "Functionality is unsupported."],
  [502, "Bad Gateway", "Invalid upstream response."],
  [503, "Service Unavailable", "Service is temporarily unavailable."],
  [504, "Gateway Timeout", "Upstream service timed out."],
] as const;

export function securityContext(code: number): string {
  if (code === 401 || code === 403)
    return "Do not reveal whether protected resources exist; enforce authorization server-side.";
  if (code === 404)
    return "Can reduce resource enumeration when used consistently for inaccessible objects.";
  if (code === 429)
    return "Helps mitigate brute force and resource-exhaustion attacks when paired with rate limiting.";
  if (code >= 500)
    return "Avoid leaking stack traces or internal implementation details in error responses.";
  if (code >= 300 && code < 400)
    return "Validate redirect destinations to prevent open-redirect vulnerabilities.";
  if (code >= 400)
    return "Return generic client-safe details and keep sensitive diagnostics in protected logs.";
  return "Apply secure headers, least privilege, and output encoding regardless of successful status.";
}
