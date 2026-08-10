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

const battleNetClientId = process.env.BATTLENET_CLIENT_ID;
if (!battleNetClientId) {
  throw new Error("BATTLENET_CLIENT_ID environment variable is not set")
}
const battleNetClientSecret = process.env.BATTLENET_CLIENT_SECRET;
if (!battleNetClientSecret) {
  throw new Error("BATTLENET_CLIENT_SECRET environment variable is not set")
}
const battleNetIssuer = process.env.BATTLENET_ISSUER as BattleNetIssuer;
if (!battleNetIssuer) {
  throw new Error("BATTLENET_ISSUER environment variable is not set")
}

export const authOptions: NextAuthConfig = {
  providers: [
    BattleNetProvider({
      clientId: battleNetClientId,
      clientSecret: battleNetClientSecret,
      issuer: battleNetIssuer,
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT & { battleNetTag?: string; battleNetId?: string }; user?: any }) {
      if (user) {
        if (user.id) token.sub = user.id.toString()
        if (user.battleNetTag) token.battleNetTag = user.battleNetTag
        if (user.battleNetId) token.battleNetId = user.battleNetId
      }
      return token
    },

    async session({ session, token }: { session: Session; token: JWT & { battleNetTag?: string; battleNetId?: string } }) {
      if (token?.sub && session.user) {
        ;(session.user as SessionUser).id = token.sub
      }

      if (session.user) {
        ;(session.user as SessionUser).battleNetTag = token.battleNetTag
        ;(session.user as SessionUser).battleNetId = token.battleNetId
      }

      return session
    },
  },
}

if (process.env.NODE_ENV === "development") {
  const testUserBattleNetId = process.env.TEST_USER_BATTLENET_ID
  if (!testUserBattleNetId) {
    throw new Error("TEST_USER_BATTLENET_ID environment variable is not set")
  }

  authOptions.providers.push(
    CredentialsProvider({
      id: "dev",
      name: "Development Login",
      credentials: {},
      async authorize() {
        const testUser = (await prisma.user.findFirst({
          where: { battleNetId: testUserBattleNetId },
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
