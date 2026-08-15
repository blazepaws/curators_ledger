import { Lockout } from "@/lib/lockouts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchableCombobox } from "./SearchableCombobox";
import { Combobox } from "./Combobox";
import { Button, CloseButton } from "./Buttons";
import { TextInput } from "./TextInput";
import { DatePicker } from "./DatePicker";
import { TextBox } from "./Textbox";
import { TagEditor } from "./TagEditor";
import { useToast } from "../ToastProvider";
import { CharacterOption } from "../CharacterCombobox";
import { TASK_LIMITS } from "@/lib/limits";

export type TaskEditData = {
    character: string;
    title: string;
    description: string;
    tags: string[];
    deadline?: Date | null;
    lockoutType: string;
};

type CreateTaskModalProps = {
    open: boolean;
    isUpdating?: boolean;
    prefilledValues?: TaskEditData;
    onClose: () => void;
    onSave: (task: TaskEditData) => void | Promise<void>;
    availableTags: readonly string[];
};

function HorizontalField({ id, label, hint, error, children }: { id: string; label: string | null; hint?: string | null; error?: string | null; children: React.ReactNode }) {
    // If the element has no label, we want the input to take the full width of the container.
    return (
        <div className="flex gap-1 flex-col">
            <div className={`
                flex gap-1 justify-between items-baseline 
                w-full ${label == null ? "[&>input]:w-full" : ""}
            `}>
                {label && <label id={`${id}-label`} htmlFor={id}>
                    {label}
                </label>}
                {children}
            </div>
            {hint && <p className="text-wow-muted-text text-xs">{hint}</p>}
            {error && <p className="text-wow-red text-xs">{error}</p>}
        </div>
    );
}

function VerticalField({ id, label, hint, error, children }: { id: string; label?: string | null; hint?: string | null; error?: string | null; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label id={`${id}-label`} htmlFor={id}>
                {label}
            </label>}
            {children}
            {hint && <span className="text-wow-muted-text text-xs">{hint}</span>}
            {error && <span className="text-wow-red text-xs">{error}</span>}
        </div>
    );
}

function makeNameRealmFromCharacterOption(character: CharacterOption): string {
    return `${character.name}-${character.realm}`;
}

export function CreateTaskModal({
    isUpdating = false,
    prefilledValues,
    onClose,
    onSave,
    availableTags,
}: CreateTaskModalProps) {

    // Big wall of state for the form fields.
    const [character, setCharacter] = useState(prefilledValues?.character ?? "");
    const [title, setTitle] = useState(prefilledValues?.title ?? "");
    const [description, setDescription] = useState(prefilledValues?.description ?? "");
    const [tags, setTags] = useState<string[]>(prefilledValues?.tags ?? []);
    const [deadline, setDeadline] = useState(prefilledValues?.deadline ? prefilledValues.deadline : null);
    const [lockoutType, setLockoutType] = useState(prefilledValues?.lockoutType ?? "No lockout");
    // We need to load the character from the API to populate the options and validate.
    const [characters, setCharacters] = useState<CharacterOption[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(false);
    const [charactersError, setCharactersError] = useState<string | null>(null);
    // Notifications
    const { pushToast } = useToast()

    const fetchCharacters = useCallback(async () => {
        setCharactersLoading(true)
        setCharactersError(null)
        try {
            const response = await fetch("/api/characters")
            if (!response.ok) throw new Error("Unable to load characters")
            const data = await response.json()
            setCharacters(Array.isArray(data) ? data : [])
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to load characters"
            setCharactersError(message)
            pushToast({ type: "error", message: "Failed to load characters." })
        } finally {
            setCharactersLoading(false)
        }
    }, []);
    useEffect(() => {
        fetchCharacters()
    }, [fetchCharacters])

    const errors = useMemo(() => {
        const e: Record<string, string> = {}
        const selectedExists = characters.some((c) => c.label === character.trim())

        if (!title.trim()) e.title = "Task name is required"
        if (title.length > TASK_LIMITS.MAX_NAME_LENGTH) e.title = `Maximum ${TASK_LIMITS.MAX_NAME_LENGTH} characters`
        if (!character.trim()) e.character = "Character is required"
        if (character.trim().length > TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
            e.character = `Maximum ${TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`
        }
        if (!e.character && !charactersLoading && characters.length > 0 && character.trim() && !selectedExists) {
            e.character = "Select a character from the list"
        }
        if (!e.character && !charactersLoading && characters.length === 0) {
            e.character = charactersError || "No characters found for this account"
        }
        if (!lockoutType) e.lockout = "Lockout is required"
        if (description.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
            e.description = `Maximum ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters`
        }
        if (tags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
            e.tags = `Maximum ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags`
        }
        if (tags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
            e.tags = `Each tag can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters`
        }
        if (deadline) {
            const d = new Date(deadline)
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            if (isNaN(d.getTime()) || d <= now) e.deadline = "Deadline must be a future date"
        }
        return e
    }, [title, character, lockoutType, description, deadline, tags, characters, charactersLoading, charactersError])


    async function onSubmit(e?: React.SubmitEvent) {
        e?.preventDefault()

        if (Object.keys(errors).length) {
            const firstError = Object.values(errors)[0] || "Please fix validation errors before saving"
            pushToast({ type: "error", message: firstError })
            return
        }

        // prepare payload (no network call here)
        const payload: TaskEditData = {
            title: title.trim().slice(0, 120),
            lockoutType,
            character: character.trim(),
            description: description.trim().slice(0, TASK_LIMITS.MAX_DESCRIPTION_LENGTH),
            deadline: deadline,
            tags: tags,
        }

        try {
            await onSave(payload)
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to create task"
            pushToast({ type: "error", message })
        }
    }

    return (
        <div className="absolute w-full h-full fixed top-0 left-0 backdrop-blur-sm z-50 flex items-center justify-center">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-task-title"
                className="
                    bg-wow-ui-background
                    p-4
                    border border-wow-border
                    relative
                    w-100
                "
            >
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3">
                    <CloseButton onClick={onClose} />
                </div>
                <div className="flex flex-col gap-4">
                    <header>
                        <h2 id="create-task-title" className="text-wow-gold text-xl">
                            {isUpdating ? "Update Task" : "Create Task"}
                        </h2>
                    </header>

                    <form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4"
                    >

                        {/* Title */}
                        <HorizontalField id="task-title" label={null} error={errors.title}>
                            <TextInput id="task-title" value={title} onChange={setTitle} placeholder="Title" required={true} />
                        </HorizontalField>

                        {/* Character */}
                        <HorizontalField id="task-character" label="Character" error={errors.character}>
                            <SearchableCombobox
                                id="task-character"
                                labelId="task-character-label"
                                options={characters.map((c) => makeNameRealmFromCharacterOption(c))}
                                placeholder="Search"
                                selectedOption={character}
                                onChange={setCharacter}
                            />
                        </HorizontalField>

                        {/* Description */}
                        <VerticalField id="task-description" label="Description" error={errors.description} >
                            <TextBox
                                id="task-description"
                                labelId="task-description-label"
                                value={description}
                                onChange={setDescription}
                                placeholder=""
                                required={true}
                                hasShadow={false}
                                maxHeightPx={200}
                                initialHeight={100}
                            />
                        </VerticalField>

                        {/* Tags */}
                        <VerticalField
                            id="task-tags"
                            label="Tags"
                            hint="Type a comma or press enter to insert a new tag."
                            error={errors.tags}
                        >
                            <TagEditor
                                id="task-tags"
                                labelId="task-tags-label"
                                tags={tags}
                                suggestions={availableTags}
                                onChange={setTags}
                                placeholder=""
                            />
                        </VerticalField>

                        {/* Deadline */}
                        <HorizontalField
                            id="task-deadline"
                            label="Deadline"
                            error={errors.deadline}
                        >
                            <DatePicker
                                id="task-deadline"
                                value={deadline ? deadline.toDateString() : ""}
                                onChange={(v) => setDeadline(v ? new Date(v) : null)}
                            />
                        </HorizontalField>

                        {/* Lockout */}
                        <HorizontalField
                            id="task-lockout"
                            label="Lockout"
                            error={errors.lockout}
                        >
                            <Combobox
                                id="task-lockout"
                                labelId="task-lockout-label"
                                options={Object.values(Lockout)}
                                selectedOption={lockoutType}
                                onChange={setLockoutType}
                            />
                        </HorizontalField>

                        {/* Actions */}
                        <footer className="flex justify-end mt-2">
                            <Button label={isUpdating ? "Update Task" : "Create Task"} disabled={Object.keys(errors).length > 0} onClick={onSubmit} />
                        </footer>
                    </form>
                </div>
            </div>
        </div>

    );
}