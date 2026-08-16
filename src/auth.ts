import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import {
  hashPassword,
  isNewPasswordAllowed,
  verifyPassword,
} from "@/lib/auth-utils";
import {
  clearLoginAttempts,
  registerLoginAttempt,
} from "@/lib/auth-rate-limit";

const credentialEmailSchema = z.email().max(254);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);
        if (!credentialEmailSchema.safeParse(email).success || password.length > 128) {
          return null;
        }
        
        try {
          const attempt = await registerLoginAttempt(email, request);
          if (!attempt.allowed) {
            console.warn("Credential sign-in rate limit exceeded");
            return null;
          }

          let user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            // アカウントが存在しない場合は新規登録
            if (!isNewPasswordAllowed(password)) return null;
            const passwordHash = await hashPassword(password);
            user = await db.user.create({
              data: {
                email,
                name: email.split("@")[0] || "User",
                provider: "credentials",
                passwordHash,
                image: null,
              },
            });
            await clearLoginAttempts(attempt.keys);
          } else {
            // 既に登録されているユーザーの場合、パスワード検証
            if (!user.passwordHash) {
              throw new Error("SocialLoginOnly");
            }
            
            const verification = await verifyPassword(password, user.passwordHash);
            if (!verification.valid) {
              return null;
            }

            await clearLoginAttempts(attempt.keys);
            if (verification.needsRehash) {
              try {
                await db.user.update({
                  where: { id: user.id },
                  data: { passwordHash: await hashPassword(password) },
                });
              } catch (migrationError) {
                console.error("Failed to upgrade password hash:", migrationError);
              }
            }
          }

          return user;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider =
          typeof token.provider === "string" ? token.provider : undefined;
      }
      return session;
    },
  },
});
