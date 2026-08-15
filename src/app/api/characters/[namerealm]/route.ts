import { getSessionUserId } from "@/lib/auth"
import { parseNameRealmString } from "@/lib/character"
import { queryCharacterExistsForUser } from "@/lib/queries"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"


/**
 * Delete a character and all associated tasks and tags for the authenticated user.
 * DELETE /api/characters/[name-realm]
 * @param req Request object.
 * @param params Route parameters containing the name-realm string.
 * @returns Only an HTTP 200 code on success and JSON on failure.
 */
export async function DELETE(req: Request, { params }: { params: { namerealm: string } }) {

    // Authenticate the user
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    // Parse the name-realm string from the route parameters
    let characterName: string, characterRealm: string;
    try {
        ({ characterName, characterRealm } = parseNameRealmString(params.namerealm))
    } catch (e) {
        return NextResponse.json({ error: "character must be name-realm" }, { status: 400 })
    }

    // Make sure the character exists before we try to delete it.
    if (!await queryCharacterExistsForUser(uid, characterName, characterRealm)) {
        return NextResponse.json({ error: "character not found" }, { status: 404 });
    }

    // Query the task IDs of the associated tasks for the character.
    const characterTasks = await prisma.task.findMany({
        where: {
            userId: uid,
            characterName: characterName,
            characterRealm: characterRealm,
        },
        select: { id: true },
    })
    const taskIds = characterTasks.map((t) => t.id)

    // Run the actual deletion in a transaction to ensure all-or-nothing behavior.
    await prisma.$transaction(async (tx) => {

        // Delete the associated tasks.
        if (taskIds.length > 0) {
            await tx.taskBoard.deleteMany({ where: { taskId: { in: taskIds } } })
            await tx.taskTag.deleteMany({ where: { taskId: { in: taskIds } } })
            await tx.task.deleteMany({ where: { id: { in: taskIds } } })
        }

        // Delete the character's tags.
        await tx.characterTag.deleteMany({
            where: {
                userId: uid,
                characterName: characterName,
                characterRealm: characterRealm,
            },
        })

        // Delete the character itself.
        await tx.character.delete({
            where: {
                userId_name_realm: {
                    userId: uid,
                    name: characterName,
                    realm: characterRealm,
                },
            },
        })
    })

    // All good :)
    return NextResponse.json({ ok: true })
}