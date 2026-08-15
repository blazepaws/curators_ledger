import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth, getSessionUserId } from "@/lib/auth"
import { calculateUnlocksAt, shouldDeleteOnComplete, type LockoutMode } from "@/lib/lockouts"
import { queryTaskForUser } from "@/lib/queries"

// POST /api/tasks/[id]/complete
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const { id } = await params
    const taskId = Number(id)
    if (!Number.isInteger(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

    const task = await queryTaskForUser(userId, taskId)
    if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 })

    const lockout = task.lockout as LockoutMode
    if (shouldDeleteOnComplete(lockout)) {
        await prisma.$transaction([
            prisma.taskTag.deleteMany({ where: { taskId } }),
            prisma.taskBoard.deleteMany({ where: { taskId } }),
            prisma.task.delete({ where: { id: taskId } }),
        ])
        return NextResponse.json({ deleted: true, id: taskId })
    }

    const session = await auth()
    const region = (session?.user as { region?: string } | undefined)?.region
    const unlocksAt = calculateUnlocksAt(lockout, region)

    const updated = await prisma.task.update({
        where: { id: taskId },
        data: { unlocksAt },
        select: { id: true, unlocksAt: true },
    })

    await prisma.taskBoard.upsert({
        where: { taskId },
        update: { active: false },
        create: { taskId, userId, active: false },
    })

    return NextResponse.json({ deleted: false, task: updated })
}