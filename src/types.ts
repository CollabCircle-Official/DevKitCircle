import type { LucideIcon } from "lucide-react";

export type Category =
  | "Converters"
  | "Security & Hashes"
  | "Formatters"
  | "Network"
  | "Generators"
  | "Data & Text"
  | "Knowledge";
export type ToolId =
  | "config"
  | "env"
  | "csv"
  | "encoder"
  | "jwt"
  | "hash"
  | "formatter"
  | "regex"
  | "curl"
  | "url"
  | "status"
  | "uuid"
  | "color"
  | "hex-library"
  | "time"
  | "diff"
  | "schema"
  | "cron"
  | "mock"
  | "network-calc"
  | "security-headers"
  | "qr"
  | "image"
  | "encoding-lab"
  | "crypto-lab"
  | "compression"
  | "text-lab"
  | "structured-data"
  | "permissions"
  | "unicode-ref"
  | "web-ref"
  | "devops-ref"
  | "pipeline";

export interface ToolDefinition {
  id: ToolId;
  title: string;
  description: string;
  category: Category;
  icon: LucideIcon;
  tags: string[];
}
