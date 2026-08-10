"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import CharacterCard, { type CharacterSummary } from "@/components/CharacterCard"
import NewTaskModal from "@/components/NewTaskModal"

type CharacterTask = {
  id: number
  name: string
  lockout?: string | null
  description: string
  deadline?: string | null
  tags: string[]
  character: string
}

type TaskPrefill = {
  name?: string
  character?: string
  description?: string
  deadline?: string
  lockout?: string
  tags?: string[]
}

type TaskPayload = {
  name: string
  lockout: string
  character: string
  description: string
  deadline: string | null
  tags: string[]
}

export default function CharactersPageClient() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newRealm, setNewRealm] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [newTags, setNewTags] = useState("")
  const [savingCharacter, setSavingCharacter] = useState(false)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalPrefill, setTaskModalPrefill] = useState<TaskPrefill | undefined>(undefined)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [tasksReloadSignal, setTasksReloadSignal] = useState(0)

  const sanitizeNameOrRealm = (value: string) => value.replace(/\s+/g, "")

  const loadCharacters = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/characters?view=full")
      if (!response.ok) throw new Error("Unable to load characters")
      const data = await response.json()
      setCharacters(Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load characters"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  const filteredCharacters = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((character) => {
      if (character.label.toLowerCase().includes(q)) return true
      return character.tags.some((tag) => tag.toLowerCase().includes(q))
    })
  }, [characters, query])

  async function createCharacter() {
    setSavingCharacter(true)
    setError(null)
    try {
      const sanitizedName = sanitizeNameOrRealm(newName)
      const sanitizedRealm = sanitizeNameOrRealm(newRealm)
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedName,
          realm: sanitizedRealm,
          notes: newNotes,
          tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to create character")
      }
      const created = await response.json()
      setCharacters((prev) => [created, ...prev])
      setShowCreate(false)
      setNewName("")
      setNewRealm("")
      setNewNotes("")
      setNewTags("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create character"
      setError(message)
    } finally {
      setSavingCharacter(false)
    }
  }

  function handleCharacterUpdated(updated: CharacterSummary) {
    setCharacters((prev) => prev.map((c) => (c.label === updated.label ? updated : c)))
  }

  function handleCharacterDeleted(label: string) {
    setCharacters((prev) => prev.filter((c) => c.label !== label))
    setTasksReloadSignal((v) => v + 1)
  }

  function openAddTask(characterLabel: string) {
    setEditingTaskId(null)
    setTaskModalPrefill({ character: characterLabel })
    setTaskModalOpen(true)
  }

  function openEditTask(task: CharacterTask) {
    setEditingTaskId(task.id)
    setTaskModalPrefill({
      name: task.name,
      character: task.character,
      description: task.description,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : undefined,
      lockout: task.lockout || undefined,
      tags: task.tags,
    })
    setTaskModalOpen(true)
  }

  async function handleSaveTask(payload: TaskPayload) {
    const response = await fetch("/api/tasks", {
      method: editingTaskId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingTaskId,
        ...payload,
        deadline: payload.deadline ? new Date(payload.deadline).toISOString() : null,
        unlocksAt: null,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || "Unable to save task")
    }

    setTaskModalOpen(false)
    setEditingTaskId(null)
    setTaskModalPrefill(undefined)
    setTasksReloadSignal((v) => v + 1)
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Characters</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded bg-accent px-3 py-1 text-black"
        >
          {showCreate ? "Close" : "New character"}
        </button>
      </div>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by character name or tag"
          className="w-full rounded border border-theme bg-surface px-3 py-2 text-foreground"
        />
      </div>

      {showCreate && (
        <section className="mb-5 rounded border border-theme bg-surface p-4 textured-border">
          <h2 className="mb-3 text-lg font-medium text-foreground">Create Character</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={newName}
              onChange={(e) => setNewName(sanitizeNameOrRealm(e.target.value))}
              placeholder="Name"
              className="rounded border border-theme bg-surface px-3 py-2 text-foreground"
            />
            <input
              value={newRealm}
              onChange={(e) => setNewRealm(sanitizeNameOrRealm(e.target.value))}
              placeholder="Realm"
              className="rounded border border-theme bg-surface px-3 py-2 text-foreground"
            />
          </div>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes"
            rows={3}
            className="mt-3 w-full rounded border border-theme bg-surface px-3 py-2 text-foreground"
          />
          <input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="mt-3 w-full rounded border border-theme bg-surface px-3 py-2 text-foreground"
          />
          <div className="mt-3">
            <button
              type="button"
              onClick={createCharacter}
              disabled={savingCharacter}
              className="rounded bg-accent px-3 py-1 text-black disabled:opacity-60"
            >
              {savingCharacter ? "Creating..." : "Create"}
            </button>
          </div>
        </section>
      )}

      {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-sm text-muted">Loading characters...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.label}
              character={character}
              onCharacterUpdated={handleCharacterUpdated}
              onCharacterDeleted={handleCharacterDeleted}
              onAddTask={openAddTask}
              onEditTask={openEditTask}
              tasksReloadSignal={tasksReloadSignal}
            />
          ))}
          {filteredCharacters.length === 0 && <div className="text-sm text-muted">No characters found.</div>}
        </div>
      )}

      {taskModalOpen && (
        <NewTaskModal
          open={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false)
            setEditingTaskId(null)
            setTaskModalPrefill(undefined)
          }}
          onSave={handleSaveTask}
          prefill={taskModalPrefill}
        />
      )}
    </main>
  )
}
