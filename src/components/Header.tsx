import Link from "next/link"
import { auth } from "@/lib/auth"
import SignOutButton from "./SignOutButton"

export default async function Header() {
  const session = await auth()

  const accountLabel =
    (session as any)?.user?.battleNetTag || (session as any)?.user?.name || (session as any)?.user?.battleNetId || "Account"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface border-theme">
      <div className="mx-auto px-4 py-3 flex items-start justify-between">
        {session ? (
          <nav className="flex items-center space-x-4">
            <Link href="/tasks" className="text-sm font-medium text-foreground hover:underline">Task Board</Link>
            <Link href="/characters" className="text-sm font-medium text-foreground hover:underline">Characters</Link>
          </nav>
        ) : (
          <div />
        )}

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <SignOutButton />
              <span className="text-sm font-medium text-foreground">{accountLabel}</span>
            </>
          ) : (
            <Link href="/login" className="ml-auto text-sm font-medium text-foreground hover:underline">Log in</Link>
          )}
        </div>
      </div>
    </header>
  )
}
