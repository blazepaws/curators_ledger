"use client"

import React from "react"
import type { TaskCardAction, TaskCardData } from "@/components/TaskCard"

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className} aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function IconPencil(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function IconTrash(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className} aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function IconPlus(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className} aria-hidden>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export function createBacklogActions(params: {
  onDelete: (id: string) => void
  onEdit: (task: TaskCardData) => void
}): TaskCardAction[] {
  return [
    {
      key: "edit",
      title: "Edit task",
      ariaLabel: "edit",
      className: "text-blue-600 hover:text-blue-800",
      icon: <IconPencil className="w-5 h-5" />,
      onClick: params.onEdit,
    },
    {
      key: "delete",
      title: "Delete task",
      ariaLabel: "delete",
      className: "text-red-600 hover:text-red-800",
      icon: <IconTrash className="w-5 h-5" />,
      onClick: (task) => params.onDelete(task.id),
    },
  ]
}

export function createActiveActions(params: {
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: TaskCardData) => void
}): TaskCardAction[] {
  return [
    {
      key: "complete",
      title: "Toggle completion",
      ariaLabel: "complete",
      className: "text-green-600 hover:text-green-800",
      icon: <IconCheck className="w-5 h-5" />,
      onClick: (task) => params.onComplete(task.id),
    },
    {
      key: "edit",
      title: "Edit task",
      ariaLabel: "edit",
      className: "text-blue-600 hover:text-blue-800",
      icon: <IconPencil className="w-5 h-5" />,
      onClick: params.onEdit,
    },
    {
      key: "delete",
      title: "Delete task",
      ariaLabel: "delete",
      className: "text-red-600 hover:text-red-800",
      icon: <IconTrash className="w-5 h-5" />,
      onClick: (task) => params.onDelete(task.id),
    },
  ]
}

export { IconPlus }
