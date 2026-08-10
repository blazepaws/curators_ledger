"use client"

import React, { useEffect, useMemo, useState } from "react"
import NameRealmText from "@/components/NameRealmText"

export type CharacterOption = {
  name: string
  realm: string
  label: string
  wowClass?: string | null
}

type CharacterComboboxProps = {
  value: string
  onChange: (v: string) => void
  options: CharacterOption[]
  loading: boolean
  error?: string
  placeholder?: string
  showLabel?: boolean
  commitOnType?: boolean
}

export default function CharacterCombobox({
  value,
  onChange,
  options,
  loading,
  error,
  placeholder = "Search character name",
  showLabel = true,
  commitOnType = true,
}: CharacterComboboxProps) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => option.name.toLowerCase().includes(q) || option.label.toLowerCase().includes(q))
  }, [options, query])

  return (
    <div className="relative">
      {showLabel && <label className="block text-sm font-medium text-foreground">Character</label>}
      <input
        value={query}
        onChange={(e) => {
          const next = e.target.value
          setQuery(next)
          if (commitOnType) onChange(next)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-theme px-3 py-2 bg-surface text-foreground ${showLabel ? "mt-1" : "mt-0"}`}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-44 overflow-auto rounded-md border border-theme bg-surface">
          {!commitOnType && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange("")
                setQuery("")
                setIsOpen(false)
              }}
              className="block w-full px-3 py-2 text-left text-sm text-muted hover:bg-foreground/10"
            >
              All characters
            </button>
          )}
          {loading && <div className="px-3 py-2 text-sm text-muted">Loading characters...</div>}
          {!loading && filtered.length === 0 && <div className="px-3 py-2 text-sm text-muted">No matching characters</div>}
          {!loading && filtered.map((option) => {
            const selected = value === option.label
            return (
              <button
                key={option.label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(option.label)
                  setQuery(option.label)
                  setIsOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-sm ${selected ? "bg-accent text-black" : "text-foreground hover:bg-foreground/10"}`}
              >
                <NameRealmText value={option.label} wowClass={option.wowClass} size="medium" />
              </button>
            )
          })}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
