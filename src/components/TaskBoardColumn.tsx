"use client"

import React, { useMemo, useState } from "react"
import TaskCard, { type TaskCardAction, type TaskCardData } from "@/components/TaskCard"
import NameRealmText from "@/components/NameRealmText"

export type TaskBoardColumnProps = {
  title: string
  count: number
  hideHeading?: boolean
  loading: boolean
  emptyMessage: string
  onDrop?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  items: TaskCardData[]
  actionsForTask: (task: TaskCardData) => TaskCardAction[]
  draggable?: boolean
  dragStart?: (e: React.DragEvent, id: string) => void
}

type CharacterGroup = {
  character: string
  items: TaskCardData[]
}

function groupByCharacter(items: TaskCardData[]): CharacterGroup[] {
  const groups = new Map<string, TaskCardData[]>()

  for (const task of items) {
    const list = groups.get(task.character) ?? []
    list.push(task)
    groups.set(task.character, list)
  }

  return Array.from(groups.entries()).map(([character, groupedItems]) => ({ character, items: groupedItems }))
}

function wowClassForGroup(items: TaskCardData[]): string | null {
  return items.find((item) => !!item.wowClass)?.wowClass ?? null
}

export function TaskBoardColumn({
  title,
  count,
  hideHeading = false,
  loading,
  emptyMessage,
  onDrop,
  onDragOver,
  items,
  actionsForTask,
  draggable = false,
  dragStart,
}: TaskBoardColumnProps) {
  const groupedItems = groupByCharacter(items)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const visibleGroups = useMemo(() => groupedItems, [groupedItems])

  function toggleGroup(character: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [character]: !prev[character],
    }))
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto px-4" onDrop={onDrop} onDragOver={onDragOver}>
      {!hideHeading && <div className="mb-2 font-medium text-foreground">{title} ({count})</div>}
      {loading ? (
        <div className="text-sm text-muted">Loading tasks…</div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleGroups.length === 0 && <div className="text-sm text-muted">{emptyMessage}</div>}
          {visibleGroups.map((group, index) => {
            const isCollapsed = !!collapsedGroups[group.character]

            return (
              <React.Fragment key={group.character}>
                <section>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.character)}
                    aria-expanded={!isCollapsed}
                    className="mb-2 flex w-full items-center justify-between gap-3 rounded px-2 py-1 text-left hover:bg-foreground/5"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted">{isCollapsed ? "+" : "–"}</span>
                      <h3>
                        <NameRealmText value={group.character} wowClass={wowClassForGroup(group.items)} size="medium" className="text-foreground" />
                      </h3>
                    </span>
                    <span className="text-xs text-muted">{group.items.length}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="flex flex-col gap-3 pb-2">
                      {group.items.map((task) => (
                        <div key={task.id} draggable={draggable} onDragStart={dragStart ? (e) => dragStart(e, task.id) : undefined} className={draggable ? "cursor-grab" : undefined}>
                          <TaskCard task={task} actions={actionsForTask(task)} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                {index < visibleGroups.length - 1 && <div className="border-t border-t-[1px] border-subtle" aria-hidden />}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
