import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "./mongodb";
import { Adapter } from "next-auth/adapters";

const providers = [];
const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (hasGoogle) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    })
  );
} else {
  console.warn("Google OAuth env vars missing. Auth is limited.");
  providers.push(
    CredentialsProvider({
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.name || "Guest",
        };
      },
    })
  );
}

export const authConfig = {
  adapter: clientPromise ? (MongoDBAdapter(clientPromise) as Adapter) : undefined,
  providers,
  session: {
    strategy: clientPromise ? "database" : "jwt",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session?.user) {
        if (user) {
          session.user.id = user.id;
        } else if (token?.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/profile",
  },
} satisfies NextAuthOptions;

