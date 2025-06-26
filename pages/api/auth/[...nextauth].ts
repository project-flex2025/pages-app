import NextAuth, { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextApiRequest, NextApiResponse } from "next";
import { getTenantConfig } from "../../../lib/getTenantConfig";

interface AuthApiResponse {
  status?: string;
  user_id?: string;
  login_token?: string;
  login_token_expiration?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const host = req.headers.host || "";

  // Localhost support: use .env.local values for local dev
  let tenantConfig;
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    tenantConfig = {
      FLEX_APP_SECRET: process.env.FLEX_APP_SECRET || "local_secret",
      AUTH_API_URL:
        process.env.AUTH_API_URL || "http://localhost:3000/api/mock-auth",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "local_nextauth_secret",
      record_status: "active",
      record_id: "local",
    };
  } else {
    tenantConfig = await getTenantConfig(host);
  }

  if (!tenantConfig || tenantConfig.record_status !== "active") {
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
            return null;
          }

          const payload = {
            action: "login",
            credential: credentials.credential,
            password: credentials.password,
            device_id: "device_id_sample",
            app_secret: tenantConfig.FLEX_APP_SECRET,
          };

          try {
            const apiRes = await fetch(tenantConfig.AUTH_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            const data: unknown = await apiRes.json();

            if (
              typeof data === "object" &&
              data !== null &&
              (data as AuthApiResponse).status === "success" &&
              typeof (data as AuthApiResponse).user_id === "string" &&
              typeof (data as AuthApiResponse).login_token === "string"
            ) {
              const resp = data as AuthApiResponse;
              return {
                id: resp.user_id as string,
                name: resp.name ?? null,
                email: resp.email ?? null,
              };
            }

            return null;
          } catch (err) {
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
        return url;
      },
    },

    secret: tenantConfig.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: 60 * 60 * 4, // 4 hours
      updateAge: 60 * 60, // 1 hour
    },
    jwt: {
      maxAge: 60 * 60 * 4, // 4 hours
    },
    pages: {
      signIn: "/login",
    },
    debug: false,
  };

  return await NextAuth(req, res, authOptions);
}
