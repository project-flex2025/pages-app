import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextApiRequest, NextApiResponse } from "next";
import { getTenantConfig, TenantConfig } from "../../../lib/getTenantConfig";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers.host || "";
  const tenantConfig = getTenantConfig(host);

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
        authorize: async (credentials) => {
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

            const data = await apiRes.json();
            console.log("Auth API response body:", data);

            if (
              apiRes.ok &&
              data.status === "success" &&
              data.user_id &&
              data.login_token
            ) {
              console.log("Authentication successful for user:", data.user_id);
              return {
                id: data.user_id,
                token: data.login_token,
                tokenExpires: data.login_token_expiration,
                name: data.name ?? null,
                email: data.email ?? null,
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
          token.token = (user as any).token;
          token.name = user.name;
          token.email = user.email;
        }
        return token;
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.token = token.token as string;
          session.user.name = token.name as string | null;
          session.user.email = token.email as string | null;
        }
        return session;
      },
    },

    secret: tenantConfig.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: 60 * 1 * 1, // 4 hours
      updateAge: 60 * 1,   // 1 hour
    },
    jwt: {
      maxAge: 60 * 1 * 1, // 4 hours
    },
    pages: {
      signIn: "/login",
    },
    debug: true,
  };

  return await NextAuth(req, res, authOptions);
}
