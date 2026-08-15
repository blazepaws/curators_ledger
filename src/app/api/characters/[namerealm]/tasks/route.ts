import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSessionUserId } from "@/lib/auth"
import { TaskData } from "@/types/task"
import { parseNameRealmString } from "@/lib/character"
import { extractWowClassFromTags } from "@/lib/classColors"
import { queryCharacterExistsForUser, queryCharacterTags } from "@/lib/queries"

// GET /api/characters/[name-realm]/tasks
export async function GET(_: Request, { params }: { params: { namerealm: string } }) {

    // Authenticate the user
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    // Parse the name-realm string
    let name: string, realm: string;
    try {
        ({ characterName: name, characterRealm: realm } = parseNameRealmString(params.namerealm))
    } catch (e) {
        return NextResponse.json({ error: "Character must be in name-realm format" }, { status: 400 })
    }

    // Ensure the character exists and belongs to the user
    if (!await queryCharacterExistsForUser(uid, name, realm)) {
        return NextResponse.json({ error: "Character not found" }, { status: 404 })
    }

    // Execute query
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

    // Get the character tags from the /api/character/[name-realm]/tags endpoint
    const tags = await queryCharacterTags(uid, name, realm);

    // Map to the TaskData type 
    const mappedTasks: TaskData[] = tasks.map((task) => ({
        id: task.id,
        character: {
            name: name,
            realm: realm,
            wowClass: extractWowClassFromTags(tags), // Extract the class from the tags
        },
        title: task.name,
        description: task.description || "",
        tags: task.tags.map((t) => t.tag),
        deadline: task.deadline,
        lockoutType: task.lockout,
        unlocksAt: task.unlocksAt,
    }))

    return NextResponse.json(mappedTasks)
}
