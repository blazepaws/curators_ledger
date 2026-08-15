import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSessionUserId } from "@/lib/auth"
import { queryTaskForUser } from "@/lib/queries"

// PATCH /api/tasks/[id]/unlocksAt
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {

    // Authenticate the user
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    // Parse the parameters
    const { id } = await params
    const taskId = Number(id)
    if (!Number.isInteger(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

    const body = await request.json()
    const unlocksAt = new Date(body?.unlocksAt)
    if (typeof body?.unlocksAt !== "string" || Number.isNaN(unlocksAt.getTime())) {
        return NextResponse.json({ error: "unlocksAt must be a valid timestamp" }, { status: 400 })
    }

    // Make sure the task exists
    const task = await queryTaskForUser(userId, taskId)
    if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 })

    // Update the task's unlocksAt field
    const updated = await prisma.task.update({
        where: { id: taskId },
        data: { unlocksAt },
        select: { id: true, unlocksAt: true },
    })

    return NextResponse.json(updated)
}