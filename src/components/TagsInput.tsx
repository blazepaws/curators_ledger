"use client"

import React, { useState } from "react"
import { IMPORTANT_TAGS } from "@/lib/tags"

type Props = {
  value: string
  onChange: (v: string) => void
  maxTags?: number
  maxTagLength?: number
  error?: string
}

export default function TagsInput({ value, onChange, maxTags, maxTagLength, error }: Props) {
  const tags = value ? value.split(",").map((t) => t.trim()).filter(Boolean) : []
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)

  const suggestions = (IMPORTANT_TAGS as readonly string[]).filter(
    (t) => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  )

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (typeof maxTagLength === "number" && trimmed.length > maxTagLength) return
    if (typeof maxTags === "number" && tags.length >= maxTags) return
    if (!tags.includes(trimmed)) onChange([...tags, trimmed].join(", "))
    setInput("")
    setOpen(false)
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag).join(", "))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
    if (e.key === "Backspace" && !input && tags.length) removeTag(tags[tags.length - 1])
  }

  const isImportant = (tag: string) => (IMPORTANT_TAGS as readonly string[]).includes(tag)

  return (
    <div>
      <label className="block text-sm font-medium text-foreground">Tags</label>
      <div className="relative mt-1">
        <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1 rounded-md border border-theme bg-surface px-2 py-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                isImportant(tag) ? "bg-accent text-black" : "bg-foreground/10 text-foreground"
              }`}
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="leading-none opacity-60 hover:opacity-100">&times;</button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => {
              const next = e.target.value
              if (typeof maxTagLength === "number" && next.length > maxTagLength) return
              setInput(next)
              setOpen(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={tags.length ? "" : "Type a tag…"}
            className="min-w-[10rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
        {open && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-1 max-h-52 w-72 overflow-auto rounded-md border border-theme bg-surface shadow-lg">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={() => addTag(s)}
                  className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent hover:text-white"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
