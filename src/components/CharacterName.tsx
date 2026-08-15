"use client";

import { useEffect, useRef, useState } from "react";
import type { CharacterData } from '@/types/character';
import type { TaskCharacterData } from '@/types/task';
import { TagDisplay } from "./TagDisplay";

const characterDetailsCache = new Map<string, { details: CharacterData; expiresAt: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000;

async function getCharacterDetails(character: TaskCharacterData): Promise<CharacterData> {
  const key = `${character.name}-${character.realm}`;
  const cached = characterDetailsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.details;

  const response = await fetch(`/api/characters/${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error("Unable to load character details");
  const details = await response.json() as CharacterData;
  characterDetailsCache.set(key, { details, expiresAt: Date.now() + CACHE_DURATION_MS });
  return details;
}

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

/**
 * Display a character's name-realm in a given font size.
 * Displays the character's name in their class color if available.
 * @param character The character data to display.
 * @returns JSX element
 */
export function CharacterName({ character, size }: { character: TaskCharacterData, size: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const [details, setDetails] = useState<CharacterData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, above: true });
    const classColor = character.wowClass ? getWowClassColor(character.wowClass) : undefined;
    const name = `${character.name}-${character.realm}`;

  async function showDetails() {
    updateTooltipPosition();
    if (details) {
      setIsOpen(details.notes.trim().length > 0 || details.tags.length > 0);
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    setError(false);
    try {
      const nextDetails = await getCharacterDetails(character);
      setDetails(nextDetails);
      setIsOpen(nextDetails.notes.trim().length > 0 || nextDetails.tags.length > 0);
    } catch {
      setError(true);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }

  function updateTooltipPosition() {
    const bounds = nameRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const tooltipWidth = 256;
    const horizontalMargin = 8;
    const left = Math.min(
      Math.max(bounds.left + bounds.width / 2 - tooltipWidth / 2, horizontalMargin),
      window.innerWidth - tooltipWidth - horizontalMargin,
    );
    const tooltipHeight = 160;
    const above = bounds.top >= tooltipHeight + 8 || bounds.bottom + tooltipHeight + 8 > window.innerHeight;
    const top = above
      ? Math.max(bounds.top - 8, tooltipHeight + 8)
      : Math.min(bounds.bottom + 8, window.innerHeight - tooltipHeight - 8);

    setTooltipPosition({
      top,
      left,
      above,
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    const reposition = () => updateTooltipPosition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen]);

    return (
    <span
      ref={nameRef}
      className="relative inline-block"
      onMouseEnter={() => void showDetails()}
      onFocus={() => void showDetails()}
      onMouseLeave={() => setIsOpen(false)}
      onBlur={() => setIsOpen(false)}
      tabIndex={0}
    >
      <span className={`text-${size}`} style={{ color: classColor }}>{name}</span>
      {isOpen && (
        <div
          className={`fixed z-[100] w-100 border border-wow-highlight-border rounded bg-wow-panel p-3 text-left text-sm text-wow-text shadow-[0_6px_14px_rgba(0,0,0,0.55)] ${tooltipPosition.above ? "-translate-y-full" : ""}`}
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          {isLoading && <div className="text-wow-muted-text">Loading character details...</div>}
          {error && <div className="text-wow-red">Unable to load character details.</div>}
          {details && (
            <div className="flex flex-col gap-2">
                            <div className="whitespace-pre-wrap break-words leading-5 [overflow-wrap:anywhere]">{details.notes || "No notes"}</div>
              <TagDisplay tags={details.tags} />
            </div>
          )}
        </div>
      )}
    </span>
    );
}