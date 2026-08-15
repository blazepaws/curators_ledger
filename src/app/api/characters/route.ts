import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {  getSessionUserId } from "@/lib/auth"
import { CHARACTER_LIMITS } from "@/lib/limits"
import { parseNameRealmString } from "@/lib/character"
import { extractWowClassFromTags } from "@/lib/classColors"

function normalizeTags(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function validateCharacterPayload(payload: { name?: unknown; realm?: unknown; notes?: unknown; tags?: unknown }) {
  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const realm = typeof payload.realm === "string" ? payload.realm.trim() : ""
  if (!name) return "Character name is required"
  if (!realm) return "Character realm is required"

  const label = `${name}-${realm}`
  if (label.length > CHARACTER_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
    return `Character name-realm can be at most ${CHARACTER_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`
  }

  if (typeof payload.notes === "string" && payload.notes.length > CHARACTER_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return `Notes can be at most ${CHARACTER_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
  }

  const tags = normalizeTags(payload.tags)
  if (tags.length > CHARACTER_LIMITS.MAX_TAGS_PER_CHARACTER) {
    return `A character can have at most ${CHARACTER_LIMITS.MAX_TAGS_PER_CHARACTER} tags`
  }
  if (tags.some((tag) => tag.length > CHARACTER_LIMITS.MAX_TAG_LENGTH)) {
    return `Tags can be at most ${CHARACTER_LIMITS.MAX_TAG_LENGTH} characters`
  }

  return null
}

// GET /api/characters
export async function GET(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const view = url.searchParams.get("view")

  const characters = await prisma.character.findMany({
    where: { userId: uid },
    include: {
      tags: {
        select: { tag: true },
        orderBy: { tag: "asc" },
      },
    },
    orderBy: [{ name: "asc" }, { realm: "asc" }],
  })

  const mapped = characters.map((c) => ({
    wowClass: extractWowClassFromTags(c.tags.map((t) => t.tag)),
    name: c.name,
    realm: c.realm,
    notes: c.notes,
    tags: c.tags.map((t) => t.tag),
    label: `${c.name}-${c.realm}`,
  }))

  if (view === "full") return NextResponse.json(mapped)

  return NextResponse.json(mapped.map((c) => ({
    name: c.name,
    realm: c.realm,
    label: c.label,
  })))
}

// POST /api/characters
export async function POST(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, realm, notes, tags } = body

  const validationError = validateCharacterPayload({ name, realm, notes, tags })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const normalizedTags = normalizeTags(tags)

  const created = await prisma.character.create({
    data: {
      userId: uid,
      name: name.trim(),
      realm: realm.trim(),
      notes: typeof notes === "string" ? notes : "",
      tags: {
        create: normalizedTags.map((tag) => ({ tag })),
      },
    },
    include: {
      tags: {
        select: { tag: true },
        orderBy: { tag: "asc" },
      },
    },
  })

  return NextResponse.json({
    name: created.name,
    realm: created.realm,
    notes: created.notes,
    tags: created.tags.map((t) => t.tag),
    label: `${created.name}-${created.realm}`,
  })
}

// PUT /api/characters
export async function PUT(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const { character, notes, tags } = body

  if (typeof character !== "string") {
    return NextResponse.json({ error: "character is required" }, { status: 400 })
  }

  let characterName: string, characterRealm: string;
  try {
    ({ characterName, characterRealm } = parseNameRealmString(character))
  } catch (e) {
    return NextResponse.json({ error: "character must be name-realm" }, { status: 400 })
  }

  if (typeof notes === "string" && notes.length > CHARACTER_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Notes can be at most ${CHARACTER_LIMITS.MAX_DESCRIPTION_LENGTH} characters` }, { status: 400 })
  }

  const normalizedTags = normalizeTags(tags)
  if (normalizedTags.length > CHARACTER_LIMITS.MAX_TAGS_PER_CHARACTER) {
    return NextResponse.json({ error: `A character can have at most ${CHARACTER_LIMITS.MAX_TAGS_PER_CHARACTER} tags` }, { status: 400 })
  }
  if (normalizedTags.some((tag) => tag.length > CHARACTER_LIMITS.MAX_TAG_LENGTH)) {
    return NextResponse.json({ error: `Tags can be at most ${CHARACTER_LIMITS.MAX_TAG_LENGTH} characters` }, { status: 400 })
  }

  const existing = await prisma.character.findUnique({
    where: {
      userId_name_realm: {
        userId: uid,
        name: characterName,
        realm: characterRealm,
      },
    },
    select: { userId: true },
  })
  if (!existing) return NextResponse.json({ error: "character not found" }, { status: 404 })

  const updated = await prisma.character.update({
    where: {
      userId_name_realm: {
        userId: uid,
        name: characterName,
        realm: characterRealm,
      },
    },
    data: {
      notes: typeof notes === "string" ? notes : "",
      tags: {
        deleteMany: {},
        create: normalizedTags.map((tag) => ({ tag })),
      },
    },
    include: {
      tags: {
        select: { tag: true },
        orderBy: { tag: "asc" },
      },
    },
  })

  return NextResponse.json({
    name: updated.name,
    realm: updated.realm,
    notes: updated.notes,
    tags: updated.tags.map((t) => t.tag),
    label: `${updated.name}-${updated.realm}`,
  })
}


