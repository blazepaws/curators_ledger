"use client"

import React from "react"
import SearchCombobox from "@/components/SearchCombobox"
import type { CharacterOption } from "@/components/CharacterCombobox"
import NameRealmText from "@/components/NameRealmText"

export type TaskBoardFiltersProps = {
  query: string
  onQueryChange: (value: string) => void
  tagFilter: string | ""
  onTagFilterChange: (value: string) => void
  characterFilter: string | ""
  onCharacterFilterChange: (value: string) => void
  allTags: string[]
  characters: CharacterOption[]
}

export default function TaskBoardFilters({
  query,
  onQueryChange,
  tagFilter,
  onTagFilterChange,
  characterFilter,
  onCharacterFilterChange,
  allTags,
  characters,
}: TaskBoardFiltersProps) {
  return (
    <div className="px-4 py-2 pb-6">
      <div className="mb-2 font-medium text-foreground">Filters</div>
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search name/description"
        className="w-full mb-1 px-2 py-1 border border-theme rounded bg-surface text-foreground"
      />
      <div className="mb-2">
        <SearchCombobox
          value={tagFilter}
          onChange={onTagFilterChange}
          options={allTags}
          getOptionValue={(tag) => tag}
          getOptionLabel={(tag) => tag}
          placeholder="Filter by tag"
          inputClassName="px-2 py-1"
          clearLabel="All tags"
          showLabel={false}
        />
      </div>
      <SearchCombobox
        value={characterFilter}
        onChange={onCharacterFilterChange}
        options={characters}
        getOptionValue={(character) => character.label}
        getOptionLabel={(character) => character.label}
        renderOption={(character) => <NameRealmText value={character.label} wowClass={character.wowClass} size="medium" />}
        loading={false}
        placeholder="Filter by character"
        inputClassName="px-2 py-1"
        clearLabel="All characters"
        showLabel={false}
      />
    </div>
  )
}
