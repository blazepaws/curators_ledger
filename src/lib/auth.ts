import NextAuth, { type Session, type NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"
import BattleNetProvider, { type BattleNetIssuer } from "next-auth/providers/battlenet"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"

interface SessionUser {
  id?: string
  battleNetTag?: string
  battleNetId?: string
}

export const authOptions: NextAuthConfig = {
  providers: [
    BattleNetProvider({
      clientId: process.env.BATTLENET_CLIENT_ID!,
      clientSecret: process.env.BATTLENET_CLIENT_SECRET!,
      issuer: process.env.BATTLENET_ISSUER! as BattleNetIssuer,
      checks: ["state", "pkce", "nonce"]
    }),
  ],
  callbacks: {

    async signIn({ user, account }) {
      console.log("=== SIGN IN CALLBACK ===")
      console.log("user:", user)
      console.log("account:", account)
      if (account?.provider === "battlenet") {

        if (!user.id) {
          console.log("No user ID found, cannot upsert user in database.")
          return false
        }

        const battleNetId = user.id.toString()
        const battleNetTag = user.name ?? ""
        const issuer = process.env.BATTLENET_ISSUER ?? ""
        const region = issuer.includes("eu.battle.net") ? "EU" : issuer.includes("kr.battle.net") ? "KR" : issuer.includes("tw.battle.net") ? "TW" : "US"

        await prisma.user.upsert({
          where: { battleNetId },
          create: { battleNetId, battleNetTag, region },
          update: { battleNetTag },
        })
      }

      return true
    },

    async jwt({ token, user }: { token: JWT & { battleNetTag?: string; battleNetId?: string }; user?: any }) {

      console.log("=== JWT CALLBACK ===")
      console.log("token BEFORE:", token)
      console.log("user:", user)

      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: {
            battleNetId: user.id.toString(),
          },
        })

        if (dbUser) {
          token.sub = dbUser.id.toString()
          token.battleNetId = dbUser.battleNetId
          token.battleNetTag = dbUser.battleNetTag
        }
      }

      console.log("token AFTER:", token)
      return token
    },

    async session({ session, token }: { session: Session; token: JWT & { battleNetTag?: string; battleNetId?: string } }) {
      if (token?.sub && session.user) {
        (session.user as SessionUser).id = token.sub;
      }

      if (session.user) {
        (session.user as SessionUser).battleNetTag = token.battleNetTag;
        (session.user as SessionUser).battleNetId = token.battleNetId;
      }

      return session
    },
  },
}

if (process.env.NODE_ENV === "development") {
  authOptions.providers.push(
    CredentialsProvider({
      id: "dev",
      name: "Development Login",
      credentials: {},
      async authorize() {
        const testUser = (await prisma.user.findFirst({
          where: { battleNetId: process.env.TEST_USER_BATTLENET_ID! },
        })) as { id: number; battleNetTag: string; battleNetId: string } | null

        if (!testUser) {
          return null
        }

        return {
          id: testUser.id.toString(),
          battleNetTag: testUser.battleNetTag,
          battleNetId: testUser.battleNetId,
        }
      },
    })
  )
}

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions)
