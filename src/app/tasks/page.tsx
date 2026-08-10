"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import NewTaskModal from "@/components/NewTaskModal"
import { createActiveActions, createBacklogActions, IconPlus } from "@/components/TaskBoardActions"
import { extractWowClassFromTags } from "@/lib/classColors"
import TaskBoardFilters from "@/components/TaskBoardFilters"
import TaskBacklog from "@/components/TaskBacklog"
import TaskActive from "@/components/TaskActive"
import type { CharacterOption } from "@/components/CharacterCombobox"
import { useToast } from "@/components/ToastProvider"
import { isLockedForNow } from "@/lib/lockouts"

type Task = {
  id: string
  userId?: number
  character: string
  wowClass?: string | null
  name: string
  lockout?: string | null
  description: string
  deadline?: string | null
  unlocksAt?: string | null
  tags: string[]
  completed?: boolean
  taskBoard?: { active?: boolean } | null
}

type TaskPayload = {
  name: string
  lockout: string
  character: string
  description: string
  deadline: string | null
  tags: string[]
}

function areTaskListsEqual(a: Task[], b: Task[]) {
  if (a === b) return true
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i += 1) {
    const left = a[i]
    const right = b[i]
    if (!left || !right) return false

    if (left.id !== right.id) return false
    if (left.name !== right.name) return false
    if (left.character !== right.character) return false
    if (left.description !== right.description) return false
    if ((left.deadline ?? null) !== (right.deadline ?? null)) return false
    if ((left.unlocksAt ?? null) !== (right.unlocksAt ?? null)) return false
    if ((left.lockout ?? null) !== (right.lockout ?? null)) return false
    if (!!left.taskBoard?.active !== !!right.taskBoard?.active) return false

    if (left.tags.length !== right.tags.length) return false
    for (let tagIndex = 0; tagIndex < left.tags.length; tagIndex += 1) {
      if (left.tags[tagIndex] !== right.tags[tagIndex]) return false
    }
  }

  return true
}

function normalizeTask(task: any): Task {
  const normalizedTags = Array.isArray(task.tags) ? task.tags.map((tag: any) => tag.tag || tag) : []
  const characterTags = Array.isArray(task.character?.tags)
    ? task.character.tags.map((tag: any) => tag.tag || tag)
    : []
  const characterLabel = typeof task.character === "string"
    ? task.character
    : task.character?.name && task.character?.realm
      ? `${task.character.name}-${task.character.realm}`
      : "Unknown-Unknown"

  return {
    id: String(task.id),
    userId: task.userId,
    character: characterLabel,
    wowClass: extractWowClassFromTags(characterTags) ?? extractWowClassFromTags(normalizedTags),
    name: task.name,
    lockout: task.lockout ?? null,
    description: task.description || "",
    deadline: task.deadline ?? null,
    unlocksAt: task.unlocksAt ?? null,
    tags: normalizedTags,
    taskBoard: task.taskBoard ?? null,
  }
}

export default function Page() {
  const [backlog, setBacklog] = useState<Task[]>([])
  const [active, setActive] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [characters, setCharacters] = useState<CharacterOption[]>([])
  const { pushToast } = useToast()

  const [q, setQ] = useState("")
  const [tagFilter, setTagFilter] = useState<string | "">("")
  const [characterFilter, setCharacterFilter] = useState<string | "">("")
  const [isComposerOpen, setComposerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const loadTasks = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const response = await fetch(`/api/tasks`)
      if (!response.ok) throw new Error("Unable to load tasks")
      const data = await response.json()
      const tasks = (data as any[])
        .map(normalizeTask)
        .filter((task) => !isLockedForNow(task.unlocksAt))
      const nextBacklog = tasks.filter((task) => !task.taskBoard?.active)
      const nextActive = tasks.filter((task) => task.taskBoard?.active)

      setBacklog((prev) => (areTaskListsEqual(prev, nextBacklog) ? prev : nextBacklog))
      setActive((prev) => (areTaskListsEqual(prev, nextActive) ? prev : nextActive))
    } catch (err) {
      if (silent) return
      const message = err instanceof Error ? err.message : "Unable to load tasks"
      setError(message)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  const loadCharacters = useCallback(async () => {
    try {
      const response = await fetch("/api/characters")
      if (!response.ok) throw new Error("Unable to load characters")
      const data = await response.json()
      setCharacters(Array.isArray(data) ? data : [])
    } catch {
      setCharacters([])
    }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      void loadTasks({ silent: true })
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [loadTasks])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    backlog.forEach((t) => t.tags.forEach((tag) => s.add(tag)))
    return Array.from(s)
  }, [backlog])

  const filteredBacklog = useMemo(() => {
    return backlog.filter((t) => {
      if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q.toLowerCase())) return false
      if (tagFilter && !t.tags.includes(tagFilter)) return false
      if (characterFilter && t.character !== characterFilter) return false
      return true
    })
  }, [backlog, q, tagFilter, characterFilter])

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/task-id", String(id))
    e.dataTransfer.setData("text/plain", String(id))
    e.dataTransfer.effectAllowed = "move"
  }

  async function persistTaskBoardActive(id: string, nextActive: boolean) {
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: nextActive }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || "Unable to move task")
    }
  }

  async function moveTaskToColumn(id: string, nextActive: boolean) {
    const sourceTask = backlog.find((t) => t.id === id) || active.find((t) => t.id === id)
    if (!sourceTask) return

    const isCurrentlyActive = !!sourceTask.taskBoard?.active
    if (isCurrentlyActive === nextActive) return

    const nextTask = { ...sourceTask, taskBoard: { ...(sourceTask.taskBoard || {}), active: nextActive } }

    if (nextActive) {
      setBacklog((prev) => prev.filter((t) => t.id !== id))
      setActive((prev) => [...prev.filter((t) => t.id !== id), nextTask])
    } else {
      setActive((prev) => prev.filter((t) => t.id !== id))
      setBacklog((prev) => [nextTask, ...prev.filter((t) => t.id !== id)])
    }

    try {
      await persistTaskBoardActive(id, nextActive)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to move task"
      setError(message)
      pushToast({ type: "error", message })
      await loadTasks()
    }
  }

  function onDropToActive(e: React.DragEvent) {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/task-id") || e.dataTransfer.getData("text/plain")
    if (!id) return
    void moveTaskToColumn(id, true)
  }

  function onDropToBacklog(e: React.DragEvent) {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/task-id") || e.dataTransfer.getData("text/plain")
    if (!id) return
    void moveTaskToColumn(id, false)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleComplete(id: string) {
    setError(null)
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "complete" }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to complete task")
      }

      const data = await response.json().catch(() => ({}))
      setActive((prev) => prev.filter((task) => task.id !== id))

      if (data?.deleted) {
        setBacklog((prev) => prev.filter((task) => task.id !== id))
      } else {
        await loadTasks()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to complete task"
      setError(message)
      pushToast({ type: "error", message })
    }
  }

  async function deleteTask(id: string) {
    setError(null)
    try {
      const response = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to delete task")
      }

      setActive((prev) => prev.filter((task) => task.id !== id))
      setBacklog((prev) => prev.filter((task) => task.id !== id))
      pushToast({ type: "success", message: "Task deleted" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete task"
      setError(message)
      pushToast({ type: "error", message })
      await loadTasks()
    }
  }

  function handleDeleteActive(id: string) {
    void deleteTask(id)
  }

  function handleDeleteBacklog(id: string) {
    void deleteTask(id)
  }

  function openComposer(task: Task | null) {
    setError(null)
    setEditingTask(task)
    setComposerOpen(true)
  }

  async function handleSaveTask(payload: TaskPayload) {
    setError(null)

    try {
      const response = await fetch("/api/tasks", {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask?.id,
          ...payload,
          deadline: payload.deadline ? new Date(payload.deadline).toISOString() : null,
          unlocksAt: null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to save task")
      }

      const savedTask = normalizeTask(await response.json())
      if (editingTask) {
        setBacklog((prev) => prev.some((task) => task.id === savedTask.id) ? prev.map((task) => (task.id === savedTask.id ? savedTask : task)) : prev)
        setActive((prev) => prev.some((task) => task.id === savedTask.id) ? prev.map((task) => (task.id === savedTask.id ? savedTask : task)) : prev)
        pushToast({ type: "success", message: "Task updated" })
      } else {
        setBacklog((prev) => [savedTask, ...prev])
        pushToast({ type: "success", message: "Task created" })
      }
      setComposerOpen(false)
      setEditingTask(null)
      await loadTasks()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save task"
      setError(message)
      pushToast({ type: "error", message })
      throw err
    }
  }

  const orderedActive = useMemo(() => {
    return [...active].sort((a, b) => a.character.localeCompare(b.character))
  }, [active])

  const backlogActions = useMemo(() => createBacklogActions({
    onDelete: handleDeleteBacklog,
    onEdit: openComposer,
  }), [handleDeleteBacklog, openComposer])

  const activeActions = useMemo(() => createActiveActions({
    onComplete: handleComplete,
    onDelete: handleDeleteActive,
    onEdit: openComposer,
  }), [handleComplete, handleDeleteActive, openComposer])

  return (
    <main className="mx-auto flex h-full min-h-0 max-w-6xl flex-col overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Task Board</h1>
        <div className="flex gap-2">
          <button onClick={() => openComposer(null)} className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-black rounded">
            <IconPlus className="w-4 h-4" />
            New task
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
        <section onDrop={onDropToActive} onDragOver={onDragOver} className="flex min-h-0 flex-col overflow-hidden">
          <h2 className="mb-4 px-4 text-base font-medium text-foreground">Today ({orderedActive.length})</h2>
          <div className="min-h-0 flex-1">
            <TaskActive
              items={orderedActive}
              loading={loading}
              onDrop={onDropToActive}
              onDragOver={onDragOver}
              actionsForTask={() => activeActions}
              dragStart={onDragStart}
            />
          </div>
        </section>

        <aside onDrop={onDropToBacklog} onDragOver={onDragOver} className="flex min-h-0 flex-col overflow-hidden">
          <h2 className="mb-4 px-4 text-base font-medium text-foreground">Backlog ({filteredBacklog.length})</h2>
          <TaskBoardFilters
            query={q}
            onQueryChange={setQ}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            characterFilter={characterFilter}
            onCharacterFilterChange={setCharacterFilter}
            allTags={allTags}
            characters={characters}
          />
          <div className="min-h-0 flex-1">
            <TaskBacklog
              items={filteredBacklog}
              loading={loading}
              onDrop={onDropToBacklog}
              onDragOver={onDragOver}
              actionsForTask={() => backlogActions}
              dragStart={onDragStart}
            />
          </div>
        </aside>
      </div>

      {isComposerOpen && (
        <NewTaskModal
          open={isComposerOpen}
          onClose={() => setComposerOpen(false)}
          onSave={handleSaveTask}
          prefill={editingTask ? {
            name: editingTask.name,
            character: editingTask.character,
            description: editingTask.description,
            deadline: editingTask.deadline ? new Date(editingTask.deadline).toISOString().slice(0,10) : undefined,
            lockout: editingTask.lockout || undefined,
            tags: editingTask.tags,
          } : undefined}
        />
      )}
    </main>
  )
}
