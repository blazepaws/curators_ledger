"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import TaskBoardFilters from "@/components/TaskBoardFilters"
import { Button } from "@/components/Buttons"
import { CreateTaskModal, type TaskEditData } from "@/components/CreateTaskModal"
import { TaskList } from "@/components/TaskList"
import { useToast } from "@/components/ToastProvider"
import { isLockedForNow } from "@/lib/lockouts"
import { DEFAULT_TAGS } from "@/lib/tags"
import type { TaskData } from "@/types/task"

type TaskResponse = Omit<TaskData, "deadline" | "unlocksAt"> & {
  deadline?: string | null
  unlocksAt?: string | null
}

type BoardState = { taskId: number, active: boolean }

// The task board's active/backlog placement, joined in from a separate endpoint.
type BoardTask = TaskData & { active: boolean }

function parseTask(task: TaskResponse, activeByTaskId: Map<number, boolean>) {
  return {
    ...task,
    active: activeByTaskId.get(task.id) ?? false,
    deadline: task.deadline ? new Date(task.deadline) : null,
    unlocksAt: task.unlocksAt ? new Date(task.unlocksAt) : null,
  }
}

function characterLabel(task: TaskData) {
  return `${task.character.name}-${task.character.realm}`
}

function areTaskListsEqual(a: BoardTask[], b: BoardTask[]) {
  if (a === b) return true
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i += 1) {
    const left = a[i]
    const right = b[i]

    if (left.id !== right.id) return false
    if (left.title !== right.title) return false
    if (left.description !== right.description) return false
    if (characterLabel(left) !== characterLabel(right)) return false
    if ((left.deadline?.getTime() ?? null) !== (right.deadline?.getTime() ?? null)) return false
    if ((left.unlocksAt?.getTime() ?? null) !== (right.unlocksAt?.getTime() ?? null)) return false
    if ((left.lockoutType ?? null) !== (right.lockoutType ?? null)) return false
    if (!!left.active !== !!right.active) return false

    if (left.tags.length !== right.tags.length) return false
    for (let tagIndex = 0; tagIndex < left.tags.length; tagIndex += 1) {
      if (left.tags[tagIndex] !== right.tags[tagIndex]) return false
    }
  }

  return true
}

export default function Page() {
  const [backlog, setBacklog] = useState<BoardTask[]>([])
  const [active, setActive] = useState<BoardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pushToast } = useToast()

  const [q, setQ] = useState("")
  const [tagFilter, setTagFilter] = useState<string | "">("")
  const [characterFilter, setCharacterFilter] = useState<string | "">("")
  const [isComposerOpen, setComposerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null)

  const loadTasks = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const [tasksResponse, boardResponse] = await Promise.all([
        fetch(`/api/tasks`),
        fetch(`/api/tasks/board`),
      ])
      if (!tasksResponse.ok) throw new Error("Unable to load tasks")
      if (!boardResponse.ok) throw new Error("Unable to load task board state")
      const data = await tasksResponse.json() as TaskResponse[]
      const boardStates = await boardResponse.json() as BoardState[]
      const activeByTaskId = new Map(boardStates.map((state) => [state.taskId, state.active]))
      const tasks = data.map((task) => parseTask(task, activeByTaskId)).filter((task) => !isLockedForNow(task.unlocksAt))
      const nextBacklog = tasks.filter((task) => !task.active)
      const nextActive = tasks.filter((task) => task.active)

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

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

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
    active.forEach((t) => t.tags.forEach((tag) => s.add(tag)))
    return Array.from(s)
  }, [backlog, active])

  const allCharacters = useMemo(() => {
    const s = new Set<string>()
    backlog.forEach((t) => s.add(characterLabel(t)))
    active.forEach((t) => s.add(characterLabel(t)))
    return Array.from(s)
  }, [backlog, active])

  const filteredBacklog = useMemo(() => {
    return backlog.filter((t) => {
      if (q && !`${t.title} ${t.description}`.toLowerCase().includes(q.toLowerCase())) return false
      if (tagFilter && !t.tags.includes(tagFilter)) return false
      if (characterFilter && characterLabel(t) !== characterFilter) return false
      return true
    })
  }, [backlog, q, tagFilter, characterFilter])

  const orderedActive = useMemo(() => {
    return [...active].sort((a, b) => characterLabel(a).localeCompare(characterLabel(b)))
  }, [active])

  function onDragStart(e: React.DragEvent, id: number) {
    e.dataTransfer.setData("text/task-id", String(id))
    e.dataTransfer.setData("text/plain", String(id))
    e.dataTransfer.effectAllowed = "move"
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function persistTaskBoardActive(id: number, nextActive: boolean) {
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

  async function moveTaskToColumn(id: number, nextActive: boolean) {
    const sourceTask = backlog.find((t) => t.id === id) || active.find((t) => t.id === id)
    if (!sourceTask) return
    if (!!sourceTask.active === nextActive) return

    const nextTask = { ...sourceTask, active: nextActive }

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
    void moveTaskToColumn(Number(id), true)
  }

  function onDropToBacklog(e: React.DragEvent) {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/task-id") || e.dataTransfer.getData("text/plain")
    if (!id) return
    void moveTaskToColumn(Number(id), false)
  }

  async function handleComplete(id: number) {
    setError(null)
    try {
      const response = await fetch(`/api/tasks/${id}/complete`, { method: "POST" })
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

  async function deleteTask(id: number) {
    setError(null)
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
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

  function openComposer(task: BoardTask | null) {
    setError(null)
    setEditingTask(task)
    setComposerOpen(true)
  }

  function openEditTaskFrom(source: BoardTask[], id: number) {
    openComposer(source.find((t) => t.id === id) ?? null)
  }

  async function handleSaveTask(payload: TaskEditData) {
    setError(null)

    try {
      const response = await fetch("/api/tasks", {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask?.id,
          ...payload,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Unable to save task")
      }

      pushToast({ type: "success", message: editingTask ? "Task updated" : "Task created" })
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

  return (
    <div className="flex h-full w-full flex-col items-center overflow-hidden">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-6 mt-4">
        <div />
        <h1 className="m-4 text-2xl text-wow-gold">Task Board</h1>
        <div className="flex justify-end gap-2">
          <Button label="Add Task" onClick={() => openComposer(null)} />
        </div>
      </div>

      <main className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden p-6">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
          <section onDrop={onDropToActive} onDragOver={onDragOver} className="flex min-h-0 flex-col overflow-hidden items-center">
            <div className="mx-auto flex min-h-0 max-w-md flex-1 flex-col items-start">
              <h2 className="mb-4 text-base text-xl font-medium">Today ({orderedActive.length})</h2>
              <div className="h-full min-h-0 overflow-y-auto scrollbar-none">
                {loading ? (
                  <div className="text-sm text-muted">Loading tasks…</div>
                ) : orderedActive.length === 0 ? (
                  <div className="text-sm text-muted">No active tasks. Drag items here from backlog.</div>
                ) : (
                  <TaskList
                    tasks={orderedActive}
                    options={{ displayCharacter: false, displayCompleteButton: true, displayEditButton: true, displayDeleteButton: true }}
                    onComplete={handleComplete}
                    onEdit={(id) => openEditTaskFrom(active, id)}
                    onDelete={deleteTask}
                    draggable
                    onDragStart={onDragStart}
                  />
                )}
              </div>
            </div>
          </section>

          <aside onDrop={onDropToBacklog} onDragOver={onDragOver} className="flex min-h-0 flex-col items-center">
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-start">
              <h2 className="mb-4 text-base text-xl font-medium">Backlog ({filteredBacklog.length})</h2>
              <TaskBoardFilters
                query={q}
                onQueryChange={setQ}
                tagFilter={tagFilter}
                onTagFilterChange={setTagFilter}
                characterFilter={characterFilter}
                onCharacterFilterChange={setCharacterFilter}
                allTags={allTags}
                characters={allCharacters}
              />
              <div className="h-full min-h-0 overflow-y-auto scrollbar-none">
                {loading ? (
                  <div className="text-sm text-muted">Loading tasks…</div>
                ) : filteredBacklog.length === 0 ? (
                  <div className="text-sm text-muted">No tasks</div>
                ) : (
                  <TaskList
                    tasks={filteredBacklog}
                    options={{ displayCharacter: false, displayEditButton: true, displayDeleteButton: true }}
                    onEdit={(id) => openEditTaskFrom(backlog, id)}
                    onDelete={deleteTask}
                    draggable
                    onDragStart={onDragStart}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isComposerOpen && (
        <CreateTaskModal
          open={true}
          isUpdating={editingTask !== null}
          prefilledValues={editingTask ? {
            character: characterLabel(editingTask),
            title: editingTask.title,
            description: editingTask.description,
            tags: editingTask.tags,
            deadline: editingTask.deadline,
            lockoutType: editingTask.lockoutType ?? "No lockout",
          } : undefined}
          onClose={() => setComposerOpen(false)}
          onSave={handleSaveTask}
          availableTags={DEFAULT_TAGS}
        />
      )}
    </div>
  )
}
