"use client"

import React, { useEffect, useMemo, useState } from "react"

type SearchComboboxProps<T> = {
  value: string
  onChange: (v: string) => void
  options: T[]
  getOptionValue: (option: T) => string
  getOptionLabel: (option: T) => string
  renderOption?: (option: T) => React.ReactNode
  loading?: boolean
  error?: string
  placeholder?: string
  inputClassName?: string
  showLabel?: boolean
  label?: string
  clearLabel?: string
  commitOnType?: boolean
}

export default function SearchCombobox<T>({
  value,
  onChange,
  options,
  getOptionValue,
  getOptionLabel,
  renderOption,
  loading = false,
  error,
  placeholder = "Search",
  inputClassName,
  showLabel = true,
  label = "Filter",
  clearLabel = "All",
  commitOnType = false,
}: SearchComboboxProps<T>) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => {
      const optionValue = getOptionValue(option).toLowerCase()
      const optionLabel = getOptionLabel(option).toLowerCase()
      return optionValue.includes(q) || optionLabel.includes(q)
    })
  }, [options, query, getOptionLabel, getOptionValue])

  const hasValue = !!value

  return (
    <div className="relative">
      {showLabel && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative mt-1">
        <input
          value={query}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            if (commitOnType) onChange(next)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className={`w-full rounded-md border border-theme px-2 py-1 pr-8 bg-surface text-foreground ${showLabel ? "" : "mt-0"} ${inputClassName || ""}`}
        />
        {hasValue && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onMouseDown={(e) => {
              e.preventDefault()
              onChange("")
              setQuery("")
              setIsOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-44 overflow-auto rounded-md border border-theme bg-surface shadow-lg">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onChange("")
              setQuery("")
              setIsOpen(false)
            }}
            className="block w-full px-3 py-2 text-left text-sm text-muted hover:bg-foreground/10"
          >
            {clearLabel}
          </button>
          {loading && <div className="px-3 py-2 text-sm text-muted">Loading...</div>}
          {!loading && filtered.length === 0 && <div className="px-3 py-2 text-sm text-muted">No matches</div>}
          {!loading && filtered.map((option) => {
            const optionValue = getOptionValue(option)
            const selected = value === optionValue
            return (
              <button
                key={optionValue}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(optionValue)
                  setQuery(getOptionLabel(option))
                  setIsOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-sm ${selected ? "bg-accent text-black" : "text-foreground hover:bg-foreground/10"}`}
              >
                {renderOption ? renderOption(option) : getOptionLabel(option)}
              </button>
            )
          })}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
