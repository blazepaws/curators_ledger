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
