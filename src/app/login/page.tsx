"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-theme bg-surface p-10 textured-border">
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-white">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Sign in to continue to your tasks.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
            onClick={() => signIn("battlenet", { redirectTo: "/tasks" })}
          >
            Sign in with Battle.net
          </button>

          <button
            type="button"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => signIn("dev", { redirectTo: "/tasks" })}
          >
            Sign in as Dev User
          </button>
        </div>

        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
          Use the dev login only in development.
        </p>
      </div>
    </div>
  )
}
