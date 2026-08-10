import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = {
  params: Promise<{ name: string; realm: string }>
}

async function getSessionUserId() {
  const session = await auth()
  const uid = Number(session?.user?.id)
  if (!session?.user?.id || Number.isNaN(uid)) return null
  return uid
}

// GET /api/characters/:name/:realm/tasks
export async function GET(_: Request, { params }: Params) {
  const uid = await getSessionUserId()
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const resolvedParams = await params
  const name = decodeURIComponent(resolvedParams.name)
  const realm = decodeURIComponent(resolvedParams.realm)

  const tasks = await prisma.task.findMany({
    where: {
      userId: uid,
      characterName: name,
      characterRealm: realm,
    },
    include: {
      tags: {
        select: { tag: true },
      },
      taskBoard: true,
      character: true,
    },
    orderBy: [{ name: "asc" }],
  })

  return NextResponse.json(tasks.map((task) => ({
    id: task.id,
    name: task.name,
    lockout: task.lockout,
    description: task.description || "",
    deadline: task.deadline,
    unlocksAt: task.unlocksAt,
    tags: task.tags.map((t) => t.tag),
    taskBoard: task.taskBoard,
    character: task.character ? `${task.character.name}-${task.character.realm}` : "Unknown-Unknown",
  })))
}
