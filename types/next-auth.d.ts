import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { JWT } from "next-auth/jwt";

export interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  token: string;
}

export interface ExtendedSession {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    token?: string;
    image?: string | null;
  };
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const response = await axios.post(
            `${process.env.AUTH_API_URL}`,
            {
              action: "login",
              credential: credentials.username,
              password: credentials.password,
              device_id: "device_unique_id", // optionally replace with actual value
              app_secret: process.env.APP_SECRET,
            },
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          const user = response.data;

          if (user?.token) {
            return {
              id: user.id,
              name: user.name ?? null,
              email: user.email ?? null,
              token: user.token,
            } satisfies CustomUser;
          }

          return null;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: CustomUser;
    }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.token = user.token;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: JWT;
    }): Promise<ExtendedSession> {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.token = token.token as string;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default handler;
