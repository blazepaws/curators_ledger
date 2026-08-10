import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { TASK_LIMITS } from "@/lib/limits"

async function getSessionUserId() {
  const session = await auth()
  const uid = Number(session?.user?.id)
  if (!session?.user?.id || Number.isNaN(uid)) return null
  return uid
}

function parseCharacterLabel(label: string) {
  const raw = label.trim()
  const idx = raw.lastIndexOf("-")
  if (idx <= 0 || idx === raw.length - 1) return null
  const name = raw.slice(0, idx).trim()
  const realm = raw.slice(idx + 1).trim()
  if (!name || !realm) return null
  return { name, realm }
}

function normalizeTags(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function extractWowClassFromTags(tags: string[]) {
  const classTag = tags.find((tag) => tag.startsWith("Class: "))
  if (!classTag) return null
  const value = classTag.slice("Class: ".length).trim()
  return value || null
}

function validateCharacterPayload(payload: { name?: unknown; realm?: unknown; notes?: unknown; tags?: unknown }) {
  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const realm = typeof payload.realm === "string" ? payload.realm.trim() : ""
  if (!name) return "Character name is required"
  if (!realm) return "Character realm is required"

  const label = `${name}-${realm}`
  if (label.length > TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
    return `Character name-realm can be at most ${TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`
  }

  if (typeof payload.notes === "string" && payload.notes.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return `Notes can be at most ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
  }

  const tags = normalizeTags(payload.tags)
  if (tags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
    return `A character can have at most ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags`
  }
  if (tags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
    return `Tags can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters`
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

  const parsed = parseCharacterLabel(character)
  if (!parsed) {
    return NextResponse.json({ error: "character must be name-realm" }, { status: 400 })
  }

  if (typeof notes === "string" && notes.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Notes can be at most ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters` }, { status: 400 })
  }

  const normalizedTags = normalizeTags(tags)
  if (normalizedTags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
    return NextResponse.json({ error: `A character can have at most ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags` }, { status: 400 })
  }
  if (normalizedTags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
    return NextResponse.json({ error: `Tags can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters` }, { status: 400 })
  }

  const existing = await prisma.character.findUnique({
    where: {
      userId_name_realm: {
        userId: uid,
        name: parsed.name,
        realm: parsed.realm,
      },
    },
    select: { userId: true },
  })
  if (!existing) return NextResponse.json({ error: "character not found" }, { status: 404 })

  const updated = await prisma.character.update({
    where: {
      userId_name_realm: {
        userId: uid,
        name: parsed.name,
        realm: parsed.realm,
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

// DELETE /api/characters?character=name-realm
export async function DELETE(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const character = url.searchParams.get("character")
  if (!character) return NextResponse.json({ error: "character is required" }, { status: 400 })

  const parsed = parseCharacterLabel(character)
  if (!parsed) return NextResponse.json({ error: "character must be name-realm" }, { status: 400 })

  const existing = await prisma.character.findUnique({
    where: {
      userId_name_realm: {
        userId: uid,
        name: parsed.name,
        realm: parsed.realm,
      },
    },
    select: { userId: true },
  })
  if (!existing) return NextResponse.json({ error: "character not found" }, { status: 404 })

  const characterTasks = await prisma.task.findMany({
    where: {
      userId: uid,
      characterName: parsed.name,
      characterRealm: parsed.realm,
    },
    select: { id: true },
  })

  const taskIds = characterTasks.map((t) => t.id)

  await prisma.$transaction(async (tx) => {
    if (taskIds.length > 0) {
      await tx.taskBoard.deleteMany({ where: { taskId: { in: taskIds } } })
      await tx.taskTag.deleteMany({ where: { taskId: { in: taskIds } } })
      await tx.task.deleteMany({ where: { id: { in: taskIds } } })
    }

    await tx.characterTag.deleteMany({
      where: {
        userId: uid,
        characterName: parsed.name,
        characterRealm: parsed.realm,
      },
    })

    await tx.character.delete({
      where: {
        userId_name_realm: {
          userId: uid,
          name: parsed.name,
          realm: parsed.realm,
        },
      },
    })
  })

  return NextResponse.json({ ok: true })
}
