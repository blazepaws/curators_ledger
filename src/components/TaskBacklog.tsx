"use client"

import React from "react"
import { TaskBoardColumn } from "@/components/TaskBoardColumn"
import type { TaskCardAction, TaskCardData } from "@/components/TaskCard"

export type TaskBacklogProps = {
  loading: boolean
  items: TaskCardData[]
  actionsForTask: (task: TaskCardData) => TaskCardAction[]
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  dragStart: (e: React.DragEvent, id: string) => void
}

export default function TaskBacklog({ loading, items, actionsForTask, onDrop, onDragOver, dragStart }: TaskBacklogProps) {
  return (
    <TaskBoardColumn
      title="Backlog"
      count={items.length}
      hideHeading
      loading={loading}
      emptyMessage="No tasks"
      onDrop={onDrop}
      onDragOver={onDragOver}
      items={items}
      actionsForTask={actionsForTask}
      draggable
      dragStart={dragStart}
    />
  )
}
