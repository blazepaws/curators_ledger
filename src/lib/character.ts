
export function parseNameRealmString(input?: string | null): { characterName: string, characterRealm: string } {
    const raw = (input || "").trim()
    if (!raw) throw new Error("Input string is empty or null")
    const idx = raw.lastIndexOf("-")
    if (idx <= 0 || idx === raw.length - 1) throw new Error("Input string is not in name-realm format")
    const name = raw.slice(0, idx).trim()
    const realm = raw.slice(idx + 1).trim()
    if (!name || !realm) throw new Error("Input string is not in name-realm format")
    return { characterName: name, characterRealm: realm }
}