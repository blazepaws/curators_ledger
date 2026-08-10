import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function CharactersLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return <div className="h-full min-h-0 bg-background">{children}</div>
}
