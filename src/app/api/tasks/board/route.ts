import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth"
import { queryTaskBoardStates } from "@/lib/queries"

// GET /api/tasks/board (task board active state for every task)
export async function GET() {
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const states = await queryTaskBoardStates(uid)
    return NextResponse.json(states)
}
