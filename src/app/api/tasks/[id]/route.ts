import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSessionUserId } from "@/lib/auth"
import { queryTaskForUser } from "@/lib/queries"

// DELETE /api/tasks/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const { id } = await params
    const taskId = Number(id)
    if (!Number.isInteger(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

    const task = await queryTaskForUser(userId, taskId)
    if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 })

    await prisma.$transaction([
        prisma.taskTag.deleteMany({ where: { taskId } }),
        prisma.taskBoard.deleteMany({ where: { taskId } }),
        prisma.task.delete({ where: { id: taskId } }),
    ])

    return NextResponse.json({ deleted: true, id: taskId })
}