import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// 🔒 Extend types for token and session
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    token?: string;
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      token?: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

// ✅ Define your auth options
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        credential: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;

        try {
          const res = await fetch(process.env.AUTH_API_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "login",
              credential: credentials.credential,
              password: credentials.password,
              device_id: "device_id_sample",
              app_secret: process.env.APP_SECRET,
            }),
          });

          const data = await res.json();
          console.log("Auth API response:", data);

          if (
            res.ok &&
            data.status === "success" &&
            data.user_id &&
            data.login_token
          ) {
            return {
              id: data.user_id,
              token: data.login_token,
              tokenExpires: data.login_token_expiration,
            };
          }

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
        session.user.id = token.id;
        session.user.token = token.token;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
