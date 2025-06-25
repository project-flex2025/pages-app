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

export async function getTenantConfig(host: string) {
  const now = Date.now();
  if (!cachedTenants.length || now - lastFetch > CACHE_TTL) {
    cachedTenants = await fetchTenantsFromAPI();
    lastFetch = now;
  }

  // Normalize host (remove www., lowercase)
  const normalizedHost = host.toLowerCase().replace(/^www\./, "");

  // Find tenant by matching NEXTAUTH_URL host, subdomain, or root domain
  const tenant = cachedTenants.find(t => {
    const tenantHost = t.NEXTAUTH_URL.replace(/^https?:\/\//, "").toLowerCase().replace(/\/$/, "");
    if (normalizedHost === tenantHost) return true;
    if (normalizedHost === `${t.record_id}.priority-hub.com`) return true;
    // Special case: root domain
    if (
      (normalizedHost === "priority-hub.com" || normalizedHost === "www.priority-hub.com") &&
      t.record_id === "root"
    ) return true;
    return false;
  });

  if (!tenant || tenant.record_status !== "active") return null;
  return tenant;
}

export async function getAllowedTenants() {
  const now = Date.now();
  if (!cachedTenants.length || now - lastFetch > CACHE_TTL) {
    cachedTenants = await fetchTenantsFromAPI();
    lastFetch = now;
  }
  return cachedTenants.filter(t => t.record_status === "active").map(t => t.record_id);
}
