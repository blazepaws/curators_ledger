"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import CharacterCard, { type CharacterSummary } from "@/components/CharacterCard"
import { Button } from "@/components/Buttons"
import { CreateCharacterModal, type CharacterCreateData } from "@/components/CreateCharacterModal"
import { CreateTaskModal, type TaskEditData } from "@/components/CreateTaskModal"
import { SearchBar } from "@/components/SearchBar"
import { DEFAULT_TAGS } from "@/lib/tags"
import type { TaskData } from "@/types/task"
import { useToast } from "@/components/ToastProvider"

export default function Page() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalPrefill, setTaskModalPrefill] = useState<TaskEditData | undefined>(undefined)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [tasksReloadSignal, setTasksReloadSignal] = useState(0)

  // Notifications
  const toast = useToast()

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

  // Push errors to the notification system when they happen.
  useEffect(() => {
    if (error) {
      toast.pushToast({
        type: "error",
        message: error,
      })
    }
  }, [error])

  useEffect(() => {
    void Promise.resolve().then(loadCharacters)
  }, [loadCharacters])

  const filteredCharacters = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((character) => {
      if (character.label.toLowerCase().includes(q)) return true
      return character.tags.some((tag) => tag.toLowerCase().includes(q))
    })
  }, [characters, query])

  async function createCharacter(character: CharacterCreateData) {
    setError(null)
    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(character),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to create character")
      }
      const created = await response.json()
      setCharacters((prev) => [created, ...prev])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create character"
      setError(message)
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
    setTaskModalPrefill({
      character: characterLabel,
      title: "",
      description: "",
      tags: [],
      lockoutType: "No lockout",
    })
    setTaskModalOpen(true)
  }

  function openEditTask(task: TaskData) {
    setEditingTaskId(task.id)
    setTaskModalPrefill({
      title: task.title,
      character: `${task.character.name}-${task.character.realm}`,
      description: task.description,
      deadline: task.deadline,
      lockoutType: task.lockoutType || "No lockout",
      tags: task.tags,
    })
    setTaskModalOpen(true)
  }

  async function handleSaveTask(payload: TaskEditData) {
    const response = await fetch("/api/tasks", {
      method: editingTaskId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editingTaskId ? { id: editingTaskId } : {}),
        ...payload,
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
    <main className="flex h-full w-full flex-col items-center">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-6 mt-4">
        <div />
        <h1 className="m-4 text-2xl text-wow-gold">Characters</h1>
        <div className="flex justify-end gap-2">
          <Button label="Add Character" onClick={() => setShowCreate(true)} />
        </div>
      </div>

      <div className="mb-4 w-full max-w-md">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by character name or tag" />
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading characters...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={`${character.label}-${tasksReloadSignal}`}
              character={character}
              onCharacterUpdated={handleCharacterUpdated}
              onCharacterDeleted={handleCharacterDeleted}
              onAddTask={openAddTask}
              onEditTask={openEditTask}
            />
          ))}
          {filteredCharacters.length === 0 && <div className="text-sm text-muted">No characters found.</div>}
        </div>
      )}

      {taskModalOpen && (
        <CreateTaskModal
          open={true}
          isUpdating={editingTaskId !== null}
          onClose={() => {
            setTaskModalOpen(false)
            setEditingTaskId(null)
            setTaskModalPrefill(undefined)
          }}
          onSave={handleSaveTask}
          prefilledValues={taskModalPrefill}
          availableTags={DEFAULT_TAGS}
        />
      )}

      {showCreate && (
        <CreateCharacterModal
          open={true}
          onClose={() => setShowCreate(false)}
          onSave={createCharacter}
        />
      )}
    </main>
  )
}
