export type ReferenceItem = {
  group: string;
  key: string;
  title: string;
  description: string;
  example?: string;
  security?: string;
};

export const webReferences: ReferenceItem[] = [
  {
    group: "HTTP Header",
    key: "Authorization",
    title: "Authorization",
    description: "Carries credentials used to authenticate a request.",
    example: "Authorization: Bearer <token>",
    security:
      "Never expose credentials in logs or client-visible error messages.",
  },
  {
    group: "HTTP Header",
    key: "Content-Type",
    title: "Content-Type",
    description:
      "Declares the media type and optional character encoding of a body.",
    example: "Content-Type: application/json; charset=utf-8",
  },
  {
    group: "HTTP Header",
    key: "Accept",
    title: "Accept",
    description: "Lists response media types acceptable to the client.",
    example: "Accept: application/json",
  },
  {
    group: "HTTP Header",
    key: "Cache-Control",
    title: "Cache-Control",
    description: "Controls browser and intermediary caching.",
    example: "Cache-Control: no-store",
    security: "Use no-store for highly sensitive responses.",
  },
  {
    group: "HTTP Header",
    key: "Content-Security-Policy",
    title: "Content-Security-Policy",
    description: "Restricts sources from which a document may load resources.",
    example: "Content-Security-Policy: default-src 'self'",
    security: "Prefer nonces or hashes over unsafe-inline.",
  },
  {
    group: "HTTP Header",
    key: "Strict-Transport-Security",
    title: "Strict-Transport-Security",
    description: "Instructs browsers to use HTTPS for future requests.",
    example: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  },
  {
    group: "HTTP Header",
    key: "X-Content-Type-Options",
    title: "X-Content-Type-Options",
    description: "Prevents MIME type sniffing.",
    example: "X-Content-Type-Options: nosniff",
  },
  {
    group: "HTTP Header",
    key: "Referrer-Policy",
    title: "Referrer-Policy",
    description: "Controls referrer information sent with navigation.",
    example: "Referrer-Policy: strict-origin-when-cross-origin",
  },
  {
    group: "MIME",
    key: "application/json .json",
    title: "application/json",
    description: "JSON documents and API payloads.",
    example: ".json",
  },
  {
    group: "MIME",
    key: "text/html .html",
    title: "text/html",
    description: "HTML documents.",
    example: ".html, .htm",
  },
  {
    group: "MIME",
    key: "text/css .css",
    title: "text/css",
    description: "Cascading Style Sheets.",
    example: ".css",
  },
  {
    group: "MIME",
    key: "application/javascript .js",
    title: "text/javascript",
    description: "JavaScript source code.",
    example: ".js, .mjs",
  },
  {
    group: "MIME",
    key: "image/png .png",
    title: "image/png",
    description: "Portable Network Graphics image.",
    example: ".png",
  },
  {
    group: "MIME",
    key: "image/webp .webp",
    title: "image/webp",
    description: "WebP raster image.",
    example: ".webp",
  },
  {
    group: "MIME",
    key: "application/pdf .pdf",
    title: "application/pdf",
    description: "Portable Document Format.",
    example: ".pdf",
  },
  {
    group: "Port",
    key: "20 21 ftp tcp",
    title: "20/21 · FTP",
    description: "File Transfer Protocol data and control channels.",
    security: "Prefer SFTP or another encrypted transport.",
  },
  {
    group: "Port",
    key: "22 ssh sftp tcp",
    title: "22 · SSH",
    description: "Secure Shell and SFTP.",
  },
  {
    group: "Port",
    key: "25 smtp tcp",
    title: "25 · SMTP",
    description: "Server-to-server email transport.",
  },
  {
    group: "Port",
    key: "53 dns tcp udp",
    title: "53 · DNS",
    description: "Domain Name System.",
  },
  {
    group: "Port",
    key: "80 http tcp",
    title: "80 · HTTP",
    description: "Unencrypted web traffic.",
  },
  {
    group: "Port",
    key: "443 https tcp",
    title: "443 · HTTPS",
    description: "HTTP over TLS.",
  },
  {
    group: "Port",
    key: "3306 mysql tcp",
    title: "3306 · MySQL",
    description: "MySQL database protocol.",
  },
  {
    group: "Port",
    key: "5432 postgres tcp",
    title: "5432 · PostgreSQL",
    description: "PostgreSQL database protocol.",
  },
  {
    group: "Port",
    key: "6379 redis tcp",
    title: "6379 · Redis",
    description: "Redis database protocol.",
    security: "Do not expose unauthenticated Redis to public networks.",
  },
  {
    group: "Regex",
    key: "email",
    title: "Email-like input",
    description: "Practical syntax check, not proof of deliverability.",
    example: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
  },
  {
    group: "Regex",
    key: "uuid",
    title: "UUID",
    description: "Matches canonical UUID text.",
    example:
      "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
  },
  {
    group: "Regex",
    key: "semver",
    title: "Semantic version",
    description: "Matches a basic semantic version.",
    example:
      "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-[0-9A-Za-z.-]+)?$",
  },
  {
    group: "Regex",
    key: "ipv4",
    title: "IPv4 candidate",
    description:
      "Matches dotted decimal shape; validate numeric ranges separately.",
    example: "^(?:\\d{1,3}\\.){3}\\d{1,3}$",
  },
];

export const devopsReferences: ReferenceItem[] = [
  {
    group: "Git",
    key: "status",
    title: "Inspect changes",
    description: "Show tracked, staged, and untracked changes.",
    example: "git status --short --branch",
  },
  {
    group: "Git",
    key: "branch",
    title: "Create a branch",
    description: "Create and switch to a new branch.",
    example: "git switch -c feature/name",
  },
  {
    group: "Git",
    key: "stash",
    title: "Temporarily stash work",
    description: "Store tracked and untracked changes.",
    example: 'git stash push -u -m "work in progress"',
  },
  {
    group: "Git",
    key: "undo commit",
    title: "Undo a public commit safely",
    description: "Create a new commit that reverses another.",
    example: "git revert <commit>",
  },
  {
    group: "Git",
    key: "bisect",
    title: "Find a regression",
    description: "Binary-search commits for the first bad change.",
    example: "git bisect start",
  },
  {
    group: "Docker",
    key: "from",
    title: "FROM",
    description: "Selects the base image for a build stage.",
    example: "FROM node:22-alpine",
  },
  {
    group: "Docker",
    key: "copy",
    title: "COPY",
    description: "Copies build-context files into an image.",
    example: "COPY package*.json ./",
  },
  {
    group: "Docker",
    key: "healthcheck",
    title: "HEALTHCHECK",
    description: "Defines how Docker determines container health.",
    example: "HEALTHCHECK CMD wget -qO- http://localhost:3000/ || exit 1",
  },
  {
    group: "Kubernetes",
    key: "deployment",
    title: "Deployment",
    description: "Manages replicated application Pods and rolling updates.",
    example: "kubectl rollout status deployment/my-app",
  },
  {
    group: "Kubernetes",
    key: "service",
    title: "Service",
    description: "Provides stable networking for a set of Pods.",
    example: "kubectl get services",
  },
  {
    group: "Kubernetes",
    key: "logs",
    title: "Read Pod logs",
    description: "Streams container output.",
    example: "kubectl logs -f pod/name",
  },
  {
    group: "Kubernetes",
    key: "probe",
    title: "Health probes",
    description: "Readiness controls traffic; liveness controls restarts.",
    example: "readinessProbe: { httpGet: { path: /health, port: 3000 } }",
  },
  {
    group: "ENV",
    key: "quote",
    title: "Quote values",
    description:
      "Quote spaces and special characters; parser behavior differs between runtimes.",
    example: 'APP_NAME="My Application"',
  },
  {
    group: "ENV",
    key: "secret",
    title: "Secrets",
    description:
      "Do not commit .env files or expose secrets through public build variables.",
    security: "Browser-visible environment values are public.",
  },
  {
    group: "ENV",
    key: "multiline",
    title: "Multiline values",
    description:
      "Support varies. Prefer escaped newlines or runtime-specific documented syntax.",
    example: 'PRIVATE_KEY="line1\\nline2"',
  },
];
