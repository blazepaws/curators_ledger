"use client"

import React, { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"

// Use a modern markdown editor that supports Next.js and recent React versions.
// Install: `npm install @uiw/react-md-editor @uiw/react-markdown-preview`
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false }) as any
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"
import { TASK_LIMITS } from "@/lib/limits"
import { LOCKOUT_OPTIONS } from "@/lib/lockouts"
import CharacterCombobox, { type CharacterOption } from "@/components/CharacterCombobox"
import { useToast } from "@/components/ToastProvider"

type Prefill = {
  name?: string
  character?: string
  description?: string
  deadline?: string // ISO date
  lockout?: string
  tags?: string[]
}

type NewTaskModalProps = {
  open: boolean
  onClose: () => void
  onSave: (payload: {
    name: string
    lockout: string
    character: string
    description: string
    deadline: string | null
    tags: string[]
  }) => Promise<void>
  prefill?: Prefill
}

import TagsInput from "@/components/TagsInput"

export default function NewTaskModal({ open, onClose, onSave, prefill }: NewTaskModalProps) {
  const [name, setName] = useState(prefill?.name ?? "")
  const [character, setCharacter] = useState(prefill?.character ?? "")
  const [description, setDescription] = useState(prefill?.description ?? "")
  const [deadline, setDeadline] = useState(prefill?.deadline ?? "")
  const [lockout, setLockout] = useState(prefill?.lockout ?? "")
  const [tagsLine, setTagsLine] = useState((prefill?.tags ?? []).join(", "))
  const [isSaving, setIsSaving] = useState(false)
  const [characters, setCharacters] = useState<CharacterOption[]>([])
  const [charactersLoading, setCharactersLoading] = useState(false)
  const [charactersError, setCharactersError] = useState<string | null>(null)
  const { pushToast } = useToast()

  useEffect(() => {
    let active = true

    async function loadCharacters() {
      setCharactersLoading(true)
      setCharactersError(null)
      try {
        const response = await fetch("/api/characters")
        if (!response.ok) throw new Error("Unable to load characters")
        const data = await response.json()
        if (!active) return
        setCharacters(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : "Unable to load characters"
        setCharactersError(message)
      } finally {
        if (active) setCharactersLoading(false)
      }
    }

    if (open) void loadCharacters()
    return () => { active = false }
  }, [open])

  // MDEditor manages its own preview state; no converter needed.

  // Simple validators
  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    const tags = assembleTags()
    const selectedExists = characters.some((c) => c.label === character.trim())

    if (!name.trim()) e.name = "Task name is required"
    if (name.length > TASK_LIMITS.MAX_NAME_LENGTH) e.name = `Maximum ${TASK_LIMITS.MAX_NAME_LENGTH} characters`
    if (!character.trim()) e.character = "Character is required"
    if (character.trim().length > TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
      e.character = `Maximum ${TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`
    }
    if (!e.character && !charactersLoading && characters.length > 0 && character.trim() && !selectedExists) {
      e.character = "Select a character from the list"
    }
    if (!e.character && !charactersLoading && characters.length === 0) {
      e.character = charactersError || "No characters found for this account"
    }
    if (!lockout) e.lockout = "Lockout is required"
    if (description.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
      e.description = `Maximum ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    }
    if (tags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
      e.tags = `Maximum ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags`
    }
    if (tags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
      e.tags = `Each tag can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters`
    }
    if (deadline) {
      const d = new Date(deadline)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (isNaN(d.getTime()) || d <= now) e.deadline = "Deadline must be a future date"
    }
    return e
  }, [name, character, lockout, description, deadline, tagsLine, characters, charactersLoading, charactersError])

  function assembleTags() {
    return tagsLine.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (Object.keys(errors).length) {
      const firstError = Object.values(errors)[0] || "Please fix validation errors before saving"
      pushToast({ type: "error", message: firstError })
      return
    }

    // prepare payload (no network call here)
    const payload = {
      name: name.trim().slice(0, 120),
      lockout,
      character: character.trim(),
      description: description.slice(0, TASK_LIMITS.MAX_DESCRIPTION_LENGTH),
      deadline: deadline || null,
      tags: assembleTags(),
    }

    try {
      setIsSaving(true)
      await onSave(payload)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
      <form onSubmit={onSubmit} className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-surface p-6 shadow-lg textured-border">
        <h2 className="text-xl font-semibold">New Task</h2>

        <div className="mt-4 grid grid-cols-1 gap-4">
            <TextInput
              label="Task Name"
              value={name}
              onChange={setName}
              maxLength={TASK_LIMITS.MAX_NAME_LENGTH}
              error={errors.name}
              placeholder="Show off Spooky"
            />

            <CharacterCombobox
              value={character}
              onChange={setCharacter}
              options={characters}
              loading={charactersLoading}
              error={errors.character}
            />

            <div>
              <label className="block text-sm font-medium text-foreground">Description</label>
              <div className="mt-2">
                <MDEditor height={400} value={description} onChange={(v: any) => setDescription(v || "")} />
                {errors.description && <p className="mt-1 text-sm text-danger">{errors.description}</p>}
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Deadline" value={deadline} onChange={setDeadline} error={errors.deadline} />
            <SelectLockout value={lockout} onChange={setLockout} error={errors.lockout} />
          </div>

          <TagsInput
            value={tagsLine}
            onChange={setTagsLine}
            maxTags={TASK_LIMITS.MAX_TAGS_PER_TASK}
            maxTagLength={TASK_LIMITS.MAX_TAG_LENGTH}
            error={errors.tags}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-theme px-4 py-2 text-foreground disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={isSaving} className="rounded-md bg-accent px-4 py-2 text-black disabled:opacity-60">{isSaving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  )
}

// -------- Private subcomponents (kept in-file) --------

function TextInput({ label, value, onChange, maxLength = 255, error, placeholder, }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number; error?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} className="mt-1 w-full rounded-md border border-theme px-3 py-2 bg-surface text-foreground" />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

function DateInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-theme px-3 py-2 bg-surface text-foreground" />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

function SelectLockout({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">Lockout</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-theme px-3 py-2 bg-surface text-foreground">
        <option value="">Select lockout</option>
        {LOCKOUT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

