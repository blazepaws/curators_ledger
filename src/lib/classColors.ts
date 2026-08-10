export const WOW_CLASS_COLORS: Record<string, string> = {
  Warrior: "#C79C6E",
  Paladin: "#F58CBA",
  Hunter: "#ABD473",
  Rogue: "#FFF569",
  Priest: "#FFFFFF",
  "Death Knight": "#C41F3B",
  Shaman: "#0070DE",
  Mage: "#69CCF0",
  Warlock: "#9482C9",
  Monk: "#00FF96",
  Druid: "#FF7D0A",
  "Demon Hunter": "#A330C9",
  Evoker: "#33937F",
}

export function extractWowClassFromTags(tags: string[]): string | null {
  const classTag = tags.find((tag) => tag.startsWith("Class: "))
  if (!classTag) return null
  return classTag.slice("Class: ".length).trim() || null
}

export function getWowClassColor(wowClass?: string | null): string | undefined {
  if (!wowClass) return undefined
  return WOW_CLASS_COLORS[wowClass]
}
