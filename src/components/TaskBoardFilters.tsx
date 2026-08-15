"use client"

import React, { useMemo } from "react"
import { SearchBar } from "@/components/SearchBar"
import { SearchableCombobox } from "@/components/SearchableCombobox"
import { HorizontalField } from "./FormElementLayout"

const ALL_TAGS_OPTION = "All tags"
const ALL_CHARACTERS_OPTION = "All characters"

export type TaskBoardFiltersProps = {
    query: string
    onQueryChange: (value: string) => void
    tagFilter: string | ""
    onTagFilterChange: (value: string) => void
    characterFilter: string | ""
    onCharacterFilterChange: (value: string) => void
    allTags: string[]
    characters: string[]
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
    const tagOptions = useMemo(() => [ALL_TAGS_OPTION, ...allTags], [allTags])
    const characterOptions = useMemo(() => [ALL_CHARACTERS_OPTION, ...characters], [characters])

    return (
        <div className="pb-4 flex flex-col gap-2 w-full">
            <div>Filters</div>
            <SearchBar value={query} onChange={onQueryChange} placeholder="Search name/description" />
            <SearchableCombobox
                options={characterOptions}
                selectedOption={characterFilter || ALL_CHARACTERS_OPTION}
                onChange={(value) => onCharacterFilterChange(value === ALL_CHARACTERS_OPTION ? "" : value)}
                placeholder="Filter by character"
            />

            <SearchableCombobox
                options={tagOptions}
                selectedOption={tagFilter || ALL_TAGS_OPTION}
                onChange={(value) => onTagFilterChange(value === ALL_TAGS_OPTION ? "" : value)}
                placeholder="Filter by tag"
            />

        </div>
    )
}
