import fs from "fs";
import path from "path";

export interface TenantConfig {
  AUTH_API_URL: string;
  APP_SECRET: string;
  NEXTAUTH_SECRET: string;
  [key: string]: string;
}

export function getTenantConfig(host: string): TenantConfig | null {
  // Root domain or www
  if (host === "priority-hub.com" || host === "www.priority-hub.com") {
    const envPath = path.join(process.cwd(), "envs", `.env.root`);
    if (!fs.existsSync(envPath)) return null;
    const raw = fs.readFileSync(envPath, "utf8");
    const config: TenantConfig = {} as TenantConfig;
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      config[key] = rest.join("=");
    }
    return config;
  }
  // Subdomain
  const match = host.match(/^([^.]+)\.priority-hub\.com$/);
  const subdomain = match ? match[1] : null;
  if (!subdomain) return null;
  const envPath = path.join(process.cwd(), "envs", `.env.${subdomain}`);
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const config: TenantConfig = {} as TenantConfig;
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    config[key] = rest.join("=");
  }
  return config;
}
