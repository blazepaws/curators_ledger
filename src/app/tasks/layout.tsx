import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function TasksLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="h-full min-h-0 bg-background overflow-hidden">
      {children}
    </div>
  )
}
