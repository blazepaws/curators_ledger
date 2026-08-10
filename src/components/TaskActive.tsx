"use client"

import React from "react"
import { TaskBoardColumn } from "@/components/TaskBoardColumn"
import type { TaskCardAction, TaskCardData } from "@/components/TaskCard"

export type TaskActiveProps = {
  loading: boolean
  items: TaskCardData[]
  actionsForTask: (task: TaskCardData) => TaskCardAction[]
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  dragStart: (e: React.DragEvent, id: string) => void
}

export default function TaskActive({ loading, items, actionsForTask, onDrop, onDragOver, dragStart }: TaskActiveProps) {
  return (
    <TaskBoardColumn
      title="Today"
      count={items.length}
      hideHeading
      loading={loading}
      emptyMessage="No active tasks. Drag items here from backlog."
      onDrop={onDrop}
      onDragOver={onDragOver}
      items={items}
      actionsForTask={actionsForTask}
      draggable
      dragStart={dragStart}
    />
  )
}
