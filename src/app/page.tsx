"use client"

import { signIn, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/Buttons"

function BattleNetButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("battlenet", { redirectTo: "/tasks" })}
      className="inline-flex min-h-10 items-center justify-center gap-3 border border-[#5eb4ff] bg-[#087be8] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.35)] transition hover:bg-[#1590f5] focus:outline-none focus:ring-2 focus:ring-[#8dccff] focus:ring-offset-2 focus:ring-offset-wow-ui-background"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/80 text-xs font-bold" aria-hidden="true">
        B
      </span>
      {label}
    </button>
  )
}

export default function Home() {
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  return (
    <div className="h-full flex flex-col">
      <section className="relative border-b border-wow-border bg-wow-ui-background flex-grow flex justify-center">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.24em] text-wow-orange">A World of Warcraft collection planner</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] text-wow-bright-text md:text-7xl">
              Stay on top of your characters, grinds, dailies, and more.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-wow-text">
              Curator&apos;s Ledger is a tool to help you organize your collection plan. 
              There are too many things to keep track of in the game with
              professions, dailies, limited time events, etc. 
              I hope this planner helps you stay organized on your way to 100%.
            </p>
            {!isAuthenticated && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <BattleNetButton label="Enter with Battle.net" />
              </div>
            )}
          </div>

          <div className="relative flex min-h-[28rem] items-end justify-center overflow-hidden md:min-h-[34rem]">
            <Image
              src="/curator.png"
              alt="The Curator"
              width={768}
              height={1024}
              priority
              className="h-full w-auto max-w-full object-contain object-bottom"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
        <article className="border-t-2 border-wow-orange pt-4">
          <p className="text-sm uppercase tracking-[0.18em] text-wow-orange">01 / Task Board</p>
          <h2 className="mt-3 text-2xl text-wow-bright-text">What will you tackle today?</h2>
          <p className="mt-3 leading-7 text-wow-muted-text">Create a personal agenda for your day by adding tasks from your backlog.</p>
        </article>
        <article className="border-t-2 border-wow-blue pt-4">
          <p className="text-sm uppercase tracking-[0.18em] text-wow-blue">02 / Today</p>
          <h2 className="mt-3 text-2xl text-wow-bright-text">What&apos;s important?</h2>
          <p className="mt-3 leading-7 text-wow-muted-text">Select a sorting mode and let the planner show you which tasks matter most.</p>
        </article>
        <article className="border-t-2 border-wow-gold pt-4">
          <p className="text-sm uppercase tracking-[0.18em] text-wow-gold">03 / Characters</p>
          <h2 className="mt-3 text-2xl text-wow-bright-text">Which alt has learned this?</h2>
          <p className="mt-3 leading-7 text-wow-muted-text">Add notes and tags to your characters so you never forget which character is best for what task.</p>
        </article>
      </section>

      <section className="border-y border-wow-border bg-wow-panel">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-wow-gold">Get started</p>
            <h2 className="mt-3 text-3xl text-wow-bright-text">Your ledger is ready when you are.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-wow-muted-text">Use Battle.net to sign in and access your ledger.</p>
          </div>
          {!isAuthenticated && (
            <div className="flex flex-col gap-3 md:min-w-64">
              <BattleNetButton label="Sign in with Battle.net" />
              {process.env.NODE_ENV === "development" && (
                <Button label="Sign in as Dev User" onClick={() => signIn("dev", { redirectTo: "/tasks" })} />
              )}
            </div>
          )}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl justify-center px-6 py-2 text-sm text-wow-muted-text gap-4">
        <Link href="/privacy" className="transition hover:text-wow-bright-text hover:underline">
          Privacy &amp; GDPR
        </Link>
        <a
          href="https://github.com/blazepaws/curators_ledger/issues"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-wow-bright-text hover:underline"
        >
          Report Issue
        </a>
      </footer>
    </div>
  )
}
