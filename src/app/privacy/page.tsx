import Link from "next/link"

export const metadata = {
  title: "Privacy and GDPR | Curator's Ledger",
  description: "Privacy and GDPR information for Curator's Ledger.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="border-t-2 border-wow-gold pt-4">
        <p className="text-sm uppercase tracking-[0.18em] text-wow-gold">Privacy and GDPR statement</p>
        <h1 className="mt-3 text-4xl text-wow-bright-text">A small, focused data footprint.</h1>
        <p className="mt-5 leading-7 text-wow-text">
          Curator&apos;s Ledger is designed to help you organize your World of Warcraft collection without collecting personal information.
        </p>
      </div>

      <section className="mt-10 space-y-8 text-wow-text">
        <div>
          <h2 className="text-xl text-wow-bright-text">What we store</h2>
          <p className="mt-2 leading-7">
            The service stores only your Battle.net tag and Battle.net ID so we can identify your account and provide the service. We do not intentionally collect or store other personal data through Curator&apos;s Ledger.
          </p>
        </div>

        <div>
          <h2 className="text-xl text-wow-bright-text">What you should not enter</h2>
          <p className="mt-2 leading-7">
            Do not enter personal information into task names, descriptions, character notes, tags, or any other free-text field. Those fields are for game-related planning only. Storing personal information there is neither intended nor safe.
          </p>
        </div>

        <div>
          <h2 className="text-xl text-wow-bright-text">GDPR</h2>
          <p className="mt-2 leading-7">
            We aim to follow data-minimization principles: only the account identifiers needed to operate the service are stored, and no personal profile is built from your use of the site. For privacy questions or requests concerning the limited account data we hold, contact the project through our GitHub.
          </p>
        </div>
      </section>

      <Link href="/" className="mt-10 inline-block text-sm text-wow-gold hover:text-wow-bright-text hover:underline">
        Back
      </Link>
    </main>
  )
}
