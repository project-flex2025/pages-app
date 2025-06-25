interface TenantApiResponse {
  data: any[];
  total_results: number;
}

let cachedTenants: any[] = [];
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function fetchTenantsFromAPI(): Promise<any[]> {
  const res = await fetch("https://e1.theflex.ai/anyapp/search/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conditions: [{ field: "feature_name", value: "envs", search_type: "exact" }],
      combination_type: "and",
      limit: 10000,
      dataset: "feature_data",
      app_secret: process.env.TENANT_SEARCH_APP_SECRET,
    }),
  });

  const json: TenantApiResponse = await res.json();
  return json.data || [];
}

const normalizeDomain = (domain: string | null | undefined) =>
  (domain || "")
    .toLowerCase()
    .trim()
    .replace(/\s/g, "")
    .replace(/^www\./, "")
    .replace(/^https?:\/\//, "")
    .replace(/^\/|\/$/g, "");

export async function getTenantConfig(host: string) {
  const now = Date.now();
  if (!cachedTenants.length || now - lastFetch > CACHE_TTL) {
    cachedTenants = await fetchTenantsFromAPI();
    lastFetch = now;
  }

  const normalizedHost = normalizeDomain(host);

  let matchedTenant: any = null;

  for (const t of cachedTenants) {
    const tenantHost = normalizeDomain(t.NEXTAUTH_URL);
    const allowedDomain = t.ALLOWED_DOMAIN ? normalizeDomain(t.ALLOWED_DOMAIN) : null;

    if (normalizedHost === tenantHost) {
      matchedTenant = t;
      break;
    }
    if (normalizedHost === `${t.record_id}.priority-hub.com`) {
      matchedTenant = t;
      break;
    }
    if (allowedDomain && normalizedHost === allowedDomain) {
      matchedTenant = t;
      break;
    }
    if (
      (normalizedHost === "priority-hub.com" || normalizedHost === "www.priority-hub.com") &&
      t.record_id === "root"
    ) {
      matchedTenant = t;
      break;
    }
  }

  if (!matchedTenant || matchedTenant.record_status !== "active") {
    return null;
  }
  return matchedTenant;
}

export async function getAllowedTenants() {
  const now = Date.now();
  if (!cachedTenants.length || now - lastFetch > CACHE_TTL) {
    cachedTenants = await fetchTenantsFromAPI();
    lastFetch = now;
  }
  return cachedTenants
    .filter(t => t.record_status === "active")
    .map(t => t.record_id);
}
