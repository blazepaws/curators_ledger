import { NextResponse } from "next/server"
import prisma from "../../../lib/prisma"
import { getSessionUserId } from "@/lib/auth"
import { TASK_LIMITS } from "@/lib/limits"
import { LOCKOUT_OPTIONS, type LockoutMode } from "@/lib/lockouts"
import { extractWowClassFromTags } from "@/lib/classColors"
import { TaskData } from "@/types/task"
import { TaskEditData } from "@/components/CreateTaskModal"
import { queryCharacterExistsForUser, queryCharacterTags } from "@/lib/queries"
import { parseNameRealmString } from "@/lib/character"

function normalizeTags(input: unknown) {
    if (!Array.isArray(input)) return []
    return input
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
}

function addLockoutTag(tags: string[], lockout: LockoutMode): string[] {
    const lockoutTag = `Lockout: ${lockout}`;
    tags = tags.filter((t) => !t.startsWith("Lockout: "));
    return [...tags, lockoutTag];
}

function validateTaskInput(data: TaskEditData & { unlocksAt?: string | null }): string | null {
    const name = typeof data.title === "string" ? data.title.trim() : ""
    if (!name) return "Task name is required"
    if (name.length > TASK_LIMITS.MAX_NAME_LENGTH) return `Task name can be at most ${TASK_LIMITS.MAX_NAME_LENGTH} characters`

    const character = typeof data.character === "string" ? data.character.trim() : ""
    if (!character) return "Character is required"
    if (character.length > TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
        return `Character name-realm can be at most ${TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`
    }

    const lockoutType = typeof data.lockoutType === "string" ? data.lockoutType.trim() : ""
    if (!lockoutType) return "Lockout is required"
    if (!LOCKOUT_OPTIONS.includes(lockoutType as LockoutMode)) {
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

/**
 * GET /api/tasks
 * Parameters: 
 *     active (optional, boolean) - if true, only return tasks that are not locked out.
 * Get all tasks of the current user.
 * @returns TaskData[] as JSON
 */
export async function GET(request: Request) {

    // Authenticate the user
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    // Update tasks that should be unlocked based on the current time. 
    // Do this before querying, so when the active parameter is used, we get the correct results.
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

    // Query tasks for the user, optionally filtering by active state.
    const { searchParams } = new URL(request.url)
    const active = searchParams.has("active")
    const tasks = await prisma.task.findMany({
        where: {
            userId: uid,
            unlocksAt: active ? null : undefined,
        },
        include: {
            tags: true,
            taskBoard: false,
            character: {
                include: {
                    tags: {
                        select: { tag: true },
                    },
                },
            },
        },
        orderBy: [{ characterName: "asc" }, { id: "asc" }],
    })

    // Transform the tasks to match the TaskData type
    const transformedTasks: TaskData[] = tasks.map((task) => {
        const tags = task.character?.tags?.map((t) => t.tag) ?? [];
        return {
            id: task.id,
            character: {
                name: task.characterName!,
                realm: task.characterRealm!,
                wowClass: extractWowClassFromTags(tags),
            },
            title: task.name,
            description: task.description,
            tags: task.tags.map((t) => t.tag),
            deadline: task.deadline,
            lockoutType: task.lockout,
            unlocksAt: task.unlocksAt,
        }
    })

    return NextResponse.json(transformedTasks)
}

// POST /api/tasks  (create a task)
export async function POST(req: Request) {
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body: TaskEditData = await req.json()
    const { title, character, lockoutType, description, deadline, tags } = body
    const normalizedTags = addLockoutTag(normalizeTags(tags), lockoutType as LockoutMode)

    // Parse the character name-realm string
    let characterName: string, characterRealm: string;
    try {
        ({ characterName, characterRealm } = parseNameRealmString(character))
    } catch(e) {
        return NextResponse.json({ error: "Character must be in name-realm format" }, { status: 400 })
    }

    // Validate the input
    const validationError = validateTaskInput({ title, character, lockoutType, description, tags: normalizedTags })
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    // Make sure the user hasn't exceeded the task limit before creating a new task.
    const existingTaskCount = await prisma.task.count({ where: { userId: uid } })
    if (existingTaskCount >= TASK_LIMITS.MAX_TASKS_PER_USER) {
        return NextResponse.json({ error: `A user can have at most ${TASK_LIMITS.MAX_TASKS_PER_USER} tasks` }, { status: 400 })
    }
    
    // Make sure the character exists for this user before creating the task.
    const characterExists = await queryCharacterExistsForUser(uid, characterName, characterRealm)
    if (!characterExists) {
        return NextResponse.json({ error: "Character does not exist for this account" }, { status: 400 })
    }

    const created = await prisma.task.create({
        data: {
            userId: uid,
            name: title,
            lockout: lockoutType,
            characterName: characterName,
            characterRealm: characterRealm,
            description: description || "",
            deadline: deadline ? new Date(deadline) : undefined,
            unlocksAt: undefined, // Tasks start out unlocked by default
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

    // Map to TaskData type
    const characterTags = await queryCharacterTags(uid, created.characterName!, created.characterRealm!);
    const taskData: TaskData = {
        id: created.id,
        character: {
            name: created.characterName!,
            realm: created.characterRealm!,
            wowClass: extractWowClassFromTags(characterTags),
        },
        title: created.name,
        description: created.description,
        tags: created.tags.map((t) => t.tag),
        deadline: created.deadline,
        lockoutType: created.lockout,
        unlocksAt: created.unlocksAt,
    }

    return NextResponse.json(taskData)
}

// PUT /api/tasks (update a task)
export async function PUT(req: Request) {
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body: TaskEditData & { id: number, unlocksAt?: string | null } = await req.json()

    const validationError = validateTaskInput(body)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    // Id
    if (!body.id) return NextResponse.json({ error: "missing task id" }, { status: 400 })
    const taskId = Number(body.id)
    if (Number.isNaN(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

    // Parse the character name-realm string
    let characterName: string, characterRealm: string;
    try {
        ({ characterName, characterRealm } = parseNameRealmString(body.character))
    } catch(e) {
        return NextResponse.json({ error: "Character must be in name-realm format" }, { status: 400 })
    }

    // Make sure the character exists.
    const characterExists = await queryCharacterExistsForUser(uid, characterName, characterRealm)
    if (!characterExists) {
        return NextResponse.json({ error: "Character does not exist for this account" }, { status: 400 })
    }

    // Tags
    const normalizedTags = normalizeTags(body.tags)

    // Make sure it exists and belongs to the user
    const existing = await prisma.task.findFirst({
        where: { id: taskId, userId: uid },
        select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: "task not found" }, { status: 404 })

    // Update the task
    const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
            name: body.title,
            lockout: body.lockoutType,
            characterName: characterName,
            characterRealm: characterRealm,
            description: body.description || "",
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            unlocksAt: body.unlocksAt ? new Date(body.unlocksAt) : undefined,
            tags: {
                deleteMany: {},
                create: normalizedTags.map((t: string) => ({ tag: t })),
            },
        },
        include: { tags: true, taskBoard: true, character: true },
    })

    // Query the tags of the character to include in the response
    // For this we query by the Character table's userId, name, and realm to join the characterTagsTable
    const characterTags = await queryCharacterTags(uid, updated.characterName!, updated.characterRealm!);

    // Map response to the TaskData type.
    const taskData: TaskData = {
        id: updated.id,
        character: {
            name: updated.characterName!,
            realm: updated.characterRealm!,
            wowClass: extractWowClassFromTags(characterTags),
        },
        title: updated.name,
        description: updated.description,
        tags: updated.tags.map((t) => t.tag),
        deadline: updated.deadline,
        lockoutType: updated.lockout,
        unlocksAt: updated.unlocksAt,
    }

    return NextResponse.json(taskData)
}

// PATCH /api/tasks (update task board active state)
export async function PATCH(req: Request) {
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = await req.json()
    const taskId = Number(body?.id)
    const active = body?.active

    if (Number.isNaN(taskId)) return NextResponse.json({ error: "invalid task id" }, { status: 400 })

    const existing = await prisma.task.findFirst({
        where: { id: taskId, userId: uid },
        select: { id: true, lockout: true },
    })
    if (!existing) return NextResponse.json({ error: "task not found" }, { status: 404 })

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

