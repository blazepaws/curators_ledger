"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, ButtonDelete } from "@/components/Buttons"
import { CharacterName } from "@/components/CharacterName"
import { TagEditor } from "@/components/TagEditor"
import { TaskCard } from "@/components/TaskCard"
import { TextBox } from "@/components/Textbox"
import { CHARACTER_LIMITS, TASK_LIMITS } from "@/lib/limits"
import { isLockedForNow } from "@/lib/lockouts"
import { DEFAULT_TAGS } from "@/lib/tags"
import type { TaskData } from "@/types/task"
import { extractWowClassFromTags } from "@/lib/classColors"

type TaskResponse = Omit<TaskData, "deadline" | "unlocksAt"> & {
  deadline?: string | null
  unlocksAt?: string | null
}

export type CharacterSummary = {
  name: string
  realm: string
  label: string
  notes: string
  tags: string[]
}

type CharacterCardProps = {
  character: CharacterSummary
  onCharacterUpdated: (updated: CharacterSummary) => void
  onCharacterDeleted: (label: string) => void
  onEditTask: (task: TaskData) => void
  onAddTask: (characterLabel: string) => void
}

export default function CharacterCard({
  character,
  onCharacterUpdated,
  onCharacterDeleted,
  onEditTask,
  onAddTask,
}: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [notesDraft, setNotesDraft] = useState(character.notes)
  const [tagsDraft, setTagsDraft] = useState(character.tags)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedTags = tagsDraft

  const tagsError = useMemo(() => {
    if (parsedTags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
      return `Maximum ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags`
    }
    if (parsedTags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
      return `Each tag can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters`
    }
    return ""
  }, [parsedTags])

  const notesError = useMemo(() => {
    if (notesDraft.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
      return `Notes can be at most ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    }
    return ""
  }, [notesDraft])

  const hasDraftChanges = useMemo(() => {
    const baselineTags = new Set(character.tags.map((tag) => tag.trim()).filter(Boolean))
    const draftTags = new Set(parsedTags.map((tag) => tag.trim()).filter(Boolean))
    if (notesDraft !== character.notes) return true
    if (draftTags.size !== baselineTags.size) return true
    return Array.from(draftTags).some((tag) => !baselineTags.has(tag))
  }, [character.notes, character.tags, notesDraft, parsedTags])

  function parseTask(task: TaskResponse): TaskData {
    return {
      ...task,
      deadline: task.deadline ? new Date(task.deadline) : null,
      unlocksAt: task.unlocksAt ? new Date(task.unlocksAt) : null,
    }
  }

  async function loadTasks(force = false) {
    if (tasksLoaded && !force) return
    setTasksLoading(true)
    setError(null)
    try {
      const url = `/api/characters/${encodeURIComponent(character.label)}/tasks`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Unable to load character tasks")
      const data = await response.json() as TaskResponse[]
      setTasks(Array.isArray(data) ? data.map(parseTask) : [])
      setTasksLoaded(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load character tasks"
      setError(message)
    } finally {
      setTasksLoading(false)
    }
  }

  async function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    if (next) await loadTasks()
  }

  const saveCharacterEdits = useCallback(async () => {
    if (!hasDraftChanges || notesError || tagsError) return
    if (isSaving) return

    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/characters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: character.label,
          notes: notesDraft,
          tags: parsedTags,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to save character")
      }
      const updated = await response.json()
      onCharacterUpdated(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save character"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }, [character.label, hasDraftChanges, isSaving, notesDraft, notesError, onCharacterUpdated, parsedTags, tagsError])

  async function deleteCharacter() {
    const confirmed = window.confirm(`Remove ${character.label} and all associated tasks? This cannot be undone.`)
    if (!confirmed) return

    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/characters?character=${encodeURIComponent(character.label)}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to delete character")
      }
      onCharacterDeleted(character.label)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete character"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  React.useEffect(() => {
    if (!hasDraftChanges || notesError || tagsError) return
    const timer = setTimeout(() => {
      void saveCharacterEdits()
    }, 650)
    return () => clearTimeout(timer)
  }, [hasDraftChanges, notesError, tagsError, saveCharacterEdits])

  return (
    <article className="w-[600px] border border-wow-border bg-wow-ui-background p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3>
          <CharacterName character={{ name: character.name, realm: character.realm, wowClass: extractWowClassFromTags(character.tags) }} size="lg" />
        </h3>
        <div className="flex items-center gap-2">
          <ButtonDelete onClick={deleteCharacter} />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-sm text-wow-text">Notes</label>
        <TextBox
          value={notesDraft}
          onChange={setNotesDraft}
          placeholder="Character notes"
          initialHeight={80}
          maxCharacters={CHARACTER_LIMITS.MAX_DESCRIPTION_LENGTH}
        />
        {notesError && <p className="mt-1 text-sm text-wow-bright-red">{notesError}</p>}
      </div>

      <div className="mb-3">
        <TagEditor tags={tagsDraft} suggestions={DEFAULT_TAGS} onChange={setTagsDraft} />
        {tagsError && <p className="mt-1 text-sm text-wow-bright-red">{tagsError}</p>}
      </div>

      {error && <p className="mb-2 text-sm text-wow-bright-red">{error}</p>}

      <div>
        <div className="mb-3 flex items-center justify-between pt-3">
          <Button label={expanded ? "Hide Tasks" : "Show Tasks"} onClick={() => { void toggleExpanded() }} />
          <Button label="Add Task" onClick={() => onAddTask(character.label)} />
        </div>

        {expanded && (
          <div className="flex flex-col gap-2">
            {tasksLoading && <div className="text-sm text-wow-muted-text">Loading tasks...</div>}
            {!tasksLoading && tasks.length === 0 && <div className="text-sm text-wow-muted-text">No tasks for this character.</div>}
            {!tasksLoading && tasks.map((task) => {
              const locked = isLockedForNow(task.unlocksAt)
              return (
                <div key={task.id} className={locked ? "opacity-60" : ""}>
                  <TaskCard task={task} options={{ displayEditButton: true }} onEdit={() => onEditTask(task)} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}
