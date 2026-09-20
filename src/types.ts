import type { LucideIcon } from "lucide-react";

export type Category =
  | "Converters"
  | "Security & Hashes"
  | "Formatters"
  | "Network"
  | "Generators";
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
  | "color";

export interface ToolDefinition {
  id: ToolId;
  title: string;
  description: string;
  category: Category;
  icon: LucideIcon;
  tags: string[];
}
