import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth"
import { queryCharacterExistsForUser, queryCharacterTags } from "@/lib/queries"
import { parseNameRealmString } from "@/lib/character"

/**
 * GET /api/character/[name-realm]/tags
 * Returns a list of tags for the given character.
 * @param req The request object.
 * @param params The route parameters.
 * @returns A JSON response containing the list of tags.    
 */
export async function GET(req: Request, { params }: { params: Promise<{ namerealm: string }> }) {

    // Authenticate the user
    const uid = await getSessionUserId()
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    // Parse the name-realm string
    const parsed = parseNameRealmString((await params).namerealm)
    if (!parsed.characterName || !parsed.characterRealm) {
        return NextResponse.json({ error: "Character must be in name-realm format" }, { status: 400 })
    }

    // Ensure the character exists and belongs to the user
    if (!await queryCharacterExistsForUser(uid, parsed.characterName, parsed.characterRealm)) {
        return NextResponse.json({ error: "Character not found" }, { status: 404 })
    }

    // Query and return
    const tags = await queryCharacterTags(uid, parsed.characterName, parsed.characterRealm)
    return NextResponse.json(tags)
}