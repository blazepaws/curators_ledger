"use client"

import React from "react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import NameRealmText from "@/components/NameRealmText"

export type TaskCardData = {
  id: string
  character: string
  name: string
  description: string
  deadline?: string | null
  unlocksAt?: string | null
  tags: string[]
  completed?: boolean
  wowClass?: string | null
}

export type TaskCardAction = {
  key: string
  title: string
  ariaLabel: string
  className?: string
  icon: React.ReactNode
  onClick: (task: TaskCardData) => void
}

type TaskCardProps = {
  task: TaskCardData
  actions?: TaskCardAction[]
}

export default function TaskCard({ task, actions = [] }: TaskCardProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setIsDarkMode(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return (
    <div className="p-3 bg-surface border border-subtle rounded shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground">{task.name}</div>
          <div className="mt-0.5">
            <NameRealmText value={task.character} wowClass={task.wowClass} size="small" />
          </div>
          <div className="task-markdown mt-1 overflow-hidden text-sm text-foreground" data-color-mode={isDarkMode ? "dark" : "light"}>
            <MarkdownPreview
              source={task.description || ""}
              style={{ background: "transparent", color: "inherit", padding: 0 }}
            />
          </div>
          {task.deadline && <div className="text-xs text-red-500 mt-1">Due: {new Date(task.deadline).toLocaleDateString()}</div>}
          {task.unlocksAt && <div className="text-xs text-amber-600 mt-1">Unlocks: {new Date(task.unlocksAt).toLocaleString()}</div>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {task.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              title={action.title}
              aria-label={action.ariaLabel}
              onClick={() => action.onClick(task)}
              className={action.className || "text-foreground hover:opacity-80"}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
