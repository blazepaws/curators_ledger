import type { Metadata } from "next";
import { Providers } from "./providers"
import "./globals.css";
import Link from "next/link"
import { auth } from "@/lib/auth"
import SignOutButton from "../components/SignOutButton"

export const metadata: Metadata = {
  title: "Curator's Ledger",
  description: "Stay organized and on top of your collecting.",
};

async function Header() {
  const session = await auth()

  const accountLabel =
    (session as any)?.user?.battleNetTag ||
    (session as any)?.user?.name ||
    (session as any)?.user?.battleNetId ||
    "Account"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-wow-panel border-wow-border">
      <div className="mx-auto px-4 py-3 grid grid-cols-3 items-center">
        {/* Left */}
        <div>
          {session ? (
            <nav className="flex items-center space-x-4">
              <Link
                href="/tasks"
                className="text-sm font-medium text-foreground hover:underline"
              >
                Task Board
              </Link>
              <Link
                href="/today"
                className="text-sm font-medium text-foreground hover:underline"
              >
                Today
              </Link>
              <Link
                href="/characters"
                className="text-sm font-medium text-foreground hover:underline"
              >
                Characters
              </Link>
            </nav>
          ) : null}
        </div>

        {/* Center */}
        <div className="text-center text-lg font-bold text-wow-bright-text">
          Curator's Ledger
        </div>

        {/* Right */}
        <div className="flex items-center justify-end space-x-4">
          {session && (
            <>
              <SignOutButton />
              <span className="text-sm font-medium text-wow-bright-text">
                {accountLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default function RootLayout({
  children
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
    >
      <body className="h-screen overflow-hidden flex flex-col bg-wow-deep-background text-wow-text">
        <Providers>
          <Header />
          <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
