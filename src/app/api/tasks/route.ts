import { NextResponse } from "next/server"
import prisma from "../../../lib/prisma"
import { auth } from "@/lib/auth"
import { TASK_LIMITS } from "@/lib/limits"
import { LOCKOUT_OPTIONS, calculateUnlocksAt, shouldDeleteOnComplete, type LockoutMode } from "@/lib/lockouts"

function parseCharacter(input?: string | null) {
  const raw = (input || "").trim()
  if (!raw) return { characterName: null, characterRealm: null }
  const idx = raw.lastIndexOf("-")
  if (idx <= 0 || idx === raw.length - 1) return { characterName: null, characterRealm: null }
  const name = raw.slice(0, idx).trim()
  const realm = raw.slice(idx + 1).trim()
  if (!name || !realm) return { characterName: null, characterRealm: null }
  return { characterName: name, characterRealm: realm }
}

function normalizeTags(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function validateTaskInput(data: {
  name?: unknown
  character?: unknown
  lockout?: unknown
  description?: unknown
  tags?: unknown
}) {
  const name = typeof data.name === "string" ? data.name.trim() : ""
  if (!name) return "Task name is required"
  if (name.length > TASK_LIMITS.MAX_NAME_LENGTH) return `Task name can be at most ${TASK_LIMITS.MAX_NAME_LENGTH} characters`

  const character = typeof data.character === "string" ? data.character.trim() : ""
  if (!character) return "Character is required"
  if (character.length > TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
    return `Character name-realm can be at most ${TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`
  }

  const lockout = typeof data.lockout === "string" ? data.lockout.trim() : ""
  if (!lockout) return "Lockout is required"
  if (!LOCKOUT_OPTIONS.includes(lockout as LockoutMode)) {
    return "Invalid lockout"
  }

  if (typeof data.description === "string" && data.description.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return `Description can be at most ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
  }

  const tags = normalizeTags(data.tags)
  if (tags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
    return `A task can have at most ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags`
  }
  if (tags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
    return `Tags can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters`
  }

  return null
}

async function getSessionUserId() {
  const session = await auth()
  const uid = Number(session?.user?.id)
  if (!session?.user?.id || Number.isNaN(uid)) return null
  return uid
}

async function getSessionRegion() {
  const session = await auth()
  const region = (session?.user as { region?: unknown } | undefined)?.region
  return typeof region === "string" ? region : null
}

async function characterExistsForUser(userId: number, characterName: string, characterRealm: string) {
  const character = await prisma.character.findUnique({
    where: {
      userId_name_realm: {
        userId,
        name: characterName,
        realm: characterRealm,
      },
    },
    select: { userId: true },
  })

  return !!character
}

// GET /api/tasks
export async function GET() {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const now = new Date()
  await prisma.task.updateMany({
    where: {
      userId: uid,
      unlocksAt: { lte: now },
    },
    data: {
      unlocksAt: null,
    },
  })

  const tasks = await prisma.task.findMany({
    where: {
      userId: uid,
      unlocksAt: null,
    },
    include: {
      tags: true,
      taskBoard: true,
      character: {
        include: {
          tags: {
            select: { tag: true },
          },
        },
      },
    },
    orderBy: [{ characterName: "asc" }, { name: "asc" }],
  })

  return NextResponse.json(tasks)
}

// POST /api/tasks  (create a task)
export async function POST(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, character, lockout, description, deadline, unlocksAt, tags } = body

  const validationError = validateTaskInput({ name, character, lockout, description, tags })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const existingTaskCount = await prisma.task.count({ where: { userId: uid } })
  if (existingTaskCount >= TASK_LIMITS.MAX_TASKS_PER_USER) {
    return NextResponse.json({ error: `A user can have at most ${TASK_LIMITS.MAX_TASKS_PER_USER} tasks` }, { status: 400 })
  }

  const parsed = parseCharacter(character)
  if (!parsed.characterName || !parsed.characterRealm) {
    return NextResponse.json({ error: "Character must be in name-realm format" }, { status: 400 })
  }
  const characterExists = await characterExistsForUser(uid, parsed.characterName, parsed.characterRealm)
  if (!characterExists) {
    return NextResponse.json({ error: "Character does not exist for this account" }, { status: 400 })
  }
  const normalizedTags = normalizeTags(tags)

  const created = await prisma.task.create({
    data: {
      userId: uid,
      name,
      lockout,
      characterName: parsed.characterName,
      characterRealm: parsed.characterRealm,
      description: description || "",
      deadline: deadline ? new Date(deadline) : undefined,
      unlocksAt: unlocksAt ? new Date(unlocksAt) : undefined,
      tags: { create: normalizedTags.map((t: string) => ({ tag: t })) },
      taskBoard: {
        create: {
          userId: uid,
          active: false,
        },
      },
    },
    include: { tags: true, taskBoard: true, character: true },
  })

  return NextResponse.json(created)
}

// PUT /api/tasks (update a task)
export async function PUT(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, name, character, lockout, description, deadline, unlocksAt, tags } = body
  if (!id) return NextResponse.json({ error: "missing task id" }, { status: 400 })

  const validationError = validateTaskInput({ name, character, lockout, description, tags })
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const taskId = Number(id)
  if (Number.isNaN(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })
  const parsed = parseCharacter(character)
  if (!parsed.characterName || !parsed.characterRealm) {
    return NextResponse.json({ error: "Character must be in name-realm format" }, { status: 400 })
  }
  const characterExists = await characterExistsForUser(uid, parsed.characterName, parsed.characterRealm)
  if (!characterExists) {
    return NextResponse.json({ error: "Character does not exist for this account" }, { status: 400 })
  }
  const normalizedTags = normalizeTags(tags)

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId: uid },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "task not found" }, { status: 404 })

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      name,
      lockout,
      characterName: parsed.characterName,
      characterRealm: parsed.characterRealm,
      description: description || "",
      deadline: deadline ? new Date(deadline) : undefined,
      unlocksAt: unlocksAt ? new Date(unlocksAt) : undefined,
      tags: {
        deleteMany: {},
        create: normalizedTags.map((t: string) => ({ tag: t })),
      },
    },
    include: { tags: true, taskBoard: true, character: true },
  })

  return NextResponse.json(updated)
}

// PATCH /api/tasks (update task board active state OR complete task)
export async function PATCH(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const taskId = Number(body?.id)
  const active = body?.active
  const action = body?.action

  if (Number.isNaN(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId: uid },
    select: { id: true, lockout: true },
  })
  if (!existing) return NextResponse.json({ error: "task not found" }, { status: 404 })

  if (action === "complete") {
    const lockout = existing.lockout as LockoutMode

    if (shouldDeleteOnComplete(lockout)) {
      await prisma.$transaction([
        prisma.taskTag.deleteMany({ where: { taskId } }),
        prisma.taskBoard.deleteMany({ where: { taskId } }),
        prisma.task.delete({ where: { id: taskId } }),
      ])
      return NextResponse.json({ deleted: true, id: taskId })
    }

    const region = await getSessionRegion()
    const unlocksAt = calculateUnlocksAt(lockout, region)

    await prisma.task.update({
      where: { id: taskId },
      data: {
        unlocksAt,
      },
    })

    await prisma.taskBoard.upsert({
      where: { taskId },
      update: { active: false },
      create: {
        taskId,
        userId: uid,
        active: false,
      },
    })

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: uid },
      include: {
        tags: true,
        taskBoard: true,
        character: {
          include: {
            tags: {
              select: { tag: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ deleted: false, task })
  }

  if (typeof active !== "boolean") return NextResponse.json({ error: "active must be a boolean" }, { status: 400 })

  await prisma.taskBoard.upsert({
    where: { taskId },
    update: { active },
    create: {
      taskId,
      userId: uid,
      active,
    },
  })

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: uid },
    include: {
      tags: true,
      taskBoard: true,
      character: {
        include: {
          tags: {
            select: { tag: true },
          },
        },
      },
    },
  })

  return NextResponse.json(task)
}

// DELETE /api/tasks?id=123 (delete task)
export async function DELETE(req: Request) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const taskId = Number(searchParams.get("id"))
  if (Number.isNaN(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId: uid },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: "task not found" }, { status: 404 })

  await prisma.$transaction([
    prisma.taskTag.deleteMany({ where: { taskId } }),
    prisma.taskBoard.deleteMany({ where: { taskId } }),
    prisma.task.delete({ where: { id: taskId } }),
  ])

  return NextResponse.json({ deleted: true, id: taskId })
}
