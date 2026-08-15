import prisma from "./prisma"

/**
 * Query a task owned by a user, including the lockout needed when completing it.
 */
export async function queryTaskForUser(userId: number, taskId: number) {
    return prisma.task.findFirst({
        where: { id: taskId, userId },
        select: { id: true, lockout: true },
    })
}

/**
 * Query the task board active state for every task belonging to a user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of { taskId, active } pairs.
 */
export async function queryTaskBoardStates(userId: number): Promise<{ taskId: number, active: boolean }[]> {
    return prisma.taskBoard.findMany({
        where: { userId },
        select: { taskId: true, active: true },
    })
}

/**
 * A query that checks if a character exists for a given user.
 * @param userId - The ID of the user.
 * @param characterName - The name of the character.
 * @param characterRealm - The realm of the character.
 * @returns A promise that resolves to true if the character exists for the user, false otherwise.
 */
export async function queryCharacterExistsForUser(userId: number, characterName: string, characterRealm: string): Promise<boolean> {
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

/**
 * Query the tags for a given character belonging to a user.
 * @param uid - The ID of the user.
 * @param name - The name of the character.
 * @param realm - The realm of the character.
 * @returns A promise that resolves to an array of tags for the character.
 */
export async function queryCharacterTags(uid: number, name: string, realm: string): Promise<string[]> {
    const characterTags = await prisma.characterTag.findMany({
        where: {
            userId: uid,
            characterName: name,
            characterRealm: realm,
        },
        select: {
            tag: true,
        },
    })

    // Return the tags
    return characterTags.map((t) => t.tag)
}