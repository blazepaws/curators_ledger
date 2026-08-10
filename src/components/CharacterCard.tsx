"use client"

import React, { useCallback, useMemo, useState } from "react"
import { extractWowClassFromTags } from "@/lib/classColors"
import TaskCard, { type TaskCardData } from "@/components/TaskCard"
import TagsInput from "@/components/TagsInput"
import { TASK_LIMITS } from "@/lib/limits"
import NameRealmText from "@/components/NameRealmText"
import { isLockedForNow } from "@/lib/lockouts"

type CharacterTask = {
  id: number
  name: string
  lockout?: string | null
  description: string
  deadline?: string | null
  unlocksAt?: string | null
  tags: string[]
  character: string
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
  onEditTask: (task: CharacterTask) => void
  onAddTask: (characterLabel: string) => void
  tasksReloadSignal: number
}

export default function CharacterCard({
  character,
  onCharacterUpdated,
  onCharacterDeleted,
  onEditTask,
  onAddTask,
  tasksReloadSignal,
}: CharacterCardProps) {
  const notesRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<CharacterTask[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [notesDraft, setNotesDraft] = useState(character.notes)
  const [tagsLineDraft, setTagsLineDraft] = useState(character.tags.join(", "))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedTags = useMemo(() => {
    return tagsLineDraft.split(",").map((t) => t.trim()).filter(Boolean)
  }, [tagsLineDraft])

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
    const baselineTags = character.tags.map((tag) => tag.trim()).filter(Boolean)
    if (notesDraft !== character.notes) return true
    if (parsedTags.length !== baselineTags.length) return true
    return parsedTags.some((tag, index) => tag !== baselineTags[index])
  }, [character.notes, character.tags, notesDraft, parsedTags])

  function toTaskCardData(task: CharacterTask): TaskCardData {
    return {
      id: String(task.id),
      character: task.character,
      name: task.name,
      description: task.description,
      deadline: task.deadline ?? null,
      unlocksAt: task.unlocksAt ?? null,
      tags: task.tags,
      wowClass: extractWowClassFromTags(task.tags),
    }
  }

  async function loadTasks(force = false) {
    if (tasksLoaded && !force) return
    setTasksLoading(true)
    setError(null)
    try {
      const url = `/api/characters/${encodeURIComponent(character.name)}/${encodeURIComponent(character.realm)}/tasks`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Unable to load character tasks")
      const data = await response.json()
      setTasks(Array.isArray(data) ? data : [])
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
    setNotesDraft(character.notes)
    setTagsLineDraft(character.tags.join(", "))
  }, [character.notes, character.tags])

  React.useEffect(() => {
    const textarea = notesRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [notesDraft])

  React.useEffect(() => {
    if (!hasDraftChanges || notesError || tagsError || isSaving) return
    const timer = setTimeout(() => {
      void saveCharacterEdits()
    }, 650)
    return () => clearTimeout(timer)
  }, [hasDraftChanges, notesError, tagsError, isSaving, saveCharacterEdits])

  React.useEffect(() => {
    if (expanded) void loadTasks(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksReloadSignal])

  return (
    <article className="rounded border border-theme bg-surface p-4 textured-border">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3>
          <NameRealmText value={character.label} wowClass={extractWowClassFromTags(character.tags)} size="big" />
        </h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={deleteCharacter} disabled={isSaving} className="rounded border border-red-300 px-2 py-1 text-sm text-red-700 disabled:opacity-60">Remove</button>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Notes</label>
        <textarea
          ref={notesRef}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-none overflow-hidden rounded border border-theme bg-surface px-2 py-1 text-sm text-foreground focus:border-white focus:outline-none focus:ring-0 focus-visible:outline-none"
          placeholder="Character notes"
        />
        {notesError && <p className="mt-1 text-sm text-danger">{notesError}</p>}
      </div>

      <div className="mb-3">
        <TagsInput
          value={tagsLineDraft}
          onChange={setTagsLineDraft}
          maxTags={TASK_LIMITS.MAX_TAGS_PER_TASK}
          maxTagLength={TASK_LIMITS.MAX_TAG_LENGTH}
          error={tagsError || undefined}
        />
      </div>

      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      {!error && isSaving && <p className="mb-2 text-xs text-muted">Saving character updates...</p>}

      <div>
        <div className="mb-2 flex items-center justify-between border-b border-subtle px-1 py-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => { void toggleExpanded() }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                void toggleExpanded()
              }
            }}
            className="flex cursor-pointer items-center"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse tasks" : "Expand tasks"}
          >
            <div className="mr-2 text-sm text-muted" aria-hidden>{expanded ? "▾" : "▸"}</div>
            <div className="text-sm font-semibold uppercase tracking-wide text-foreground">Tasks</div>
          </div>
          <button
            type="button"
            onClick={() => onAddTask(character.label)}
            className="rounded border border-theme px-2 py-1 text-sm text-foreground"
          >
            Add task
          </button>
        </div>

        {expanded && (
          <div className="flex flex-col gap-2">
            {tasksLoading && <div className="text-sm text-muted">Loading tasks...</div>}
            {!tasksLoading && tasks.length === 0 && <div className="text-sm text-muted">No tasks for this character.</div>}
            {!tasksLoading && tasks.map((task) => {
              const locked = isLockedForNow(task.unlocksAt)
              const unlockLabel = locked && task.unlocksAt
                ? new Date(task.unlocksAt).toLocaleString()
                : null
              return (
                <div key={task.id} className={locked ? "opacity-60" : ""}>
                  <TaskCard
                    task={toTaskCardData(task)}
                    actions={[
                      {
                        key: "edit",
                        title: "Edit task",
                        ariaLabel: "edit",
                        className: "rounded border border-theme px-2 py-1 text-sm text-foreground",
                        icon: <span>Edit</span>,
                        onClick: () => onEditTask(task),
                      },
                    ]}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}
