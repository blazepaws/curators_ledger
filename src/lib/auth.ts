import NextAuth, { type Session, type NextAuthConfig, Account, User, Profile } from "next-auth"
import type { JWT } from "next-auth/jwt"
import BattleNetProvider, { type BattleNetIssuer } from "next-auth/providers/battlenet"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"


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

    async signIn({ user, account, profile }: { user: User & { dbId?: number }; account?: Account | null; profile?: Profile }) {

      if (account?.provider === "battlenet" && user?.id) {
        // When a user signs in with Battle.net, we need to make sure
        // they have an account in our database. If they don't, we create one.

        const battleNetId = account?.providerAccountId;
        const battleNetTag = (profile as any)?.battle_tag;

        if (!battleNetId) {
          console.error("Battle.net account ID is missing.")
          return false;
        }
        if (!battleNetTag) {
          console.error("Battle.net tag is missing.")
          return false;
        }

        const region = "EU" // TODO: If we need to access other Blizzard APIs we need to deal with regionality properly.

        try {
          const dbUser = await prisma.user.upsert({
            where: { battleNetId },
            create: { battleNetId, battleNetTag, region },
            update: { battleNetTag },
          });
          // Pass our own user ID from the database down.
          user.dbId = dbUser.id;
        } catch (error) {
          console.error("Error upserting user in database:", error)
          return false;
        }
      }

      return true;
    },

    async jwt({ token, account, user }: { token: JWT & { id?: number, bnetAccessToken?: string }; account?: Account | null; user: User & { dbId?: number } }) {

      // Again, pass our own ID down to the token, so we can eventually put it in the session.
      if (user?.dbId) {
        token.id = user.dbId;
      }

      // Also put the bnet API access token in here.
      if (account?.provider === "battlenet") {
        token.bnetAccessToken = account?.access_token;
      }
      
      return token
    },

    async session({ session, token }: { session: Session; token: JWT & { id?: number } }) {

      // Create a session that has our own user ID and the display name.
      if (session.user) {
        session.user.id = token.id?.toString();
        session.user.name = token.name;
      }

      return session
    },
  },
}

// In development we add an escape hatch to allow logging in without authentication.
// DANGER: DO NOT ENABLE THIS IN PRODUCTION. It allows anyone to log in as the test user.
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
