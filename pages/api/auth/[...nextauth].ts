import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextApiRequest, NextApiResponse } from "next";

interface TenantApiResponse {
  data: any[];
  total_results: number;
}

interface AuthApiResponse {
  status?: string;
  user_id?: string;
  login_token?: string;
  login_token_expiration?: string;
  name?: string;
  email?: string;
  [key: string]: any;
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

  const json = (await res.json()) as TenantApiResponse;
  return json.data || [];
}

async function getTenantConfig(host: string) {
  const now = Date.now();
  if (!cachedTenants.length || now - lastFetch > CACHE_TTL) {
    cachedTenants = await fetchTenantsFromAPI();
    lastFetch = now;
  }

  const normalizedHost = host.toLowerCase().replace(/^www\./, "");

  const tenant = cachedTenants.find(t => {
    const tenantHost = t.NEXTAUTH_URL
      .replace(/^https?:\/\//, "")
      .toLowerCase()
      .replace(/\/$/, "");
    if (normalizedHost === tenantHost) return true;
    if (normalizedHost === `${t.record_id}.priority-hub.com`) return true;
    return false;
  });

  if (!tenant || tenant.record_status !== "active") return null;
  return tenant;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers.host || "";
  const tenantConfig = await getTenantConfig(host);

  console.log("API Host header:", host);
  console.log("TenantConfig loaded:", tenantConfig);

  if (!tenantConfig) {
    console.warn("No tenant config found for host:", host);
    return res.status(403).json({ error: "Unauthorized subdomain" });
  }

  const authOptions: AuthOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          credential: { label: "Username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials): Promise<User | null> => {
          if (!credentials) {
            console.warn("No credentials provided to authorize.");
            return null;
          }

          console.log("Authorize received credentials:", credentials);

          const payload = {
            action: "login",
            credential: credentials.credential,
            password: credentials.password,
            device_id: "device_id_sample",
            app_secret: tenantConfig.FLEX_APP_SECRET,
          };
          console.log("Payload sent to Auth API:", payload);

          try {
            const apiRes = await fetch(tenantConfig.AUTH_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            console.log("Auth API HTTP status:", apiRes.status);

            const data: unknown = await apiRes.json();
            console.log("Auth API response body:", data);

            if (
              typeof data === "object" &&
              data !== null &&
              (data as AuthApiResponse).status === "success" &&
              typeof (data as AuthApiResponse).user_id === "string" &&
              typeof (data as AuthApiResponse).login_token === "string"
            ) {
              const resp = data as AuthApiResponse;
              console.log("Authentication successful for user:", resp.user_id);
              return {
                id: resp.user_id as string,
                name: resp.name ?? null,
                email: resp.email ?? null,
              };
            }

            console.warn("Authentication failed:", data);
            return null;
          } catch (err) {
            console.error("Authorize error:", err);
            return null;
          }
        },
      }),
    ],

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = (user as any).id;
          token.name = user.name;
          token.email = user.email;
        }
        return token;
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string | null;
          session.user.email = token.email as string | null;
        }
        return session;
      },

      async redirect({ url, baseUrl }) {
        // Always use the provided url for redirects (fixes subdomain issues)
        return url;
      },
    },

    secret: tenantConfig.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: 60 * 60 * 4, // 4 hours
      updateAge: 60 * 60,   // 1 hour
    },
    jwt: {
      maxAge: 60 * 60 * 4, // 4 hours
    },
    pages: {
      signIn: "/login",
    },
    debug: true,
  };

  return await NextAuth(req, res, authOptions);
}
