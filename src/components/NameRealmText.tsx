"use client"

import React from "react"
import { getWowClassColor } from "@/lib/classColors"

type NameRealmTextSize = "big" | "medium" | "small"

type NameRealmTextProps = {
  value: string
  wowClass?: string | null
  size?: NameRealmTextSize
  className?: string
}

const SIZE_CLASS: Record<NameRealmTextSize, string> = {
  big: "text-lg font-semibold",
  medium: "text-sm font-medium",
  small: "text-xs font-medium",
}

export default function NameRealmText({ value, wowClass, size = "medium", className = "" }: NameRealmTextProps) {
  const color = getWowClassColor(wowClass)
  const combinedClassName = `${SIZE_CLASS[size]} ${className}`.trim()

  return (
    <span className={combinedClassName} style={color ? { color } : undefined}>
      {value}
    </span>
  )
}
