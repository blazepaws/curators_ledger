import React, { useMemo, useState } from "react";
import { TASK_LIMITS } from "@/lib/limits";
import { DEFAULT_TAGS } from "@/lib/tags";
import { useToast } from "../ToastProvider";
import { Button, CloseButton } from "./Buttons";
import { TagEditor } from "./TagEditor";
import { TextBox } from "./Textbox";
import { TextInput } from "./TextInput";

export type CharacterCreateData = {
    name: string;
    realm: string;
    notes: string;
    tags: string[];
};

type CreateCharacterModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (character: CharacterCreateData) => void | Promise<void>;
};

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label id={`${id}-label`} htmlFor={id}>{label}</label>
            {children}
            {error && <p className="text-xs text-wow-red">{error}</p>}
        </div>
    );
}

export function CreateCharacterModal({ onClose, onSave }: CreateCharacterModalProps) {
    const [name, setName] = useState("");
    const [realm, setRealm] = useState("");
    const [notes, setNotes] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const { pushToast } = useToast();

    const errors = useMemo(() => {
        const nextErrors: Record<string, string> = {};
        const normalizedName = name.replace(/\s+/g, "");
        const normalizedRealm = realm.replace(/\s+/g, "");

        if (!normalizedName) nextErrors.name = "Character name is required";
        if (!normalizedRealm) nextErrors.realm = "Realm is required";
        if (`${normalizedName}-${normalizedRealm}`.length > TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH) {
            nextErrors.name = `Name and realm can be at most ${TASK_LIMITS.MAX_CHARACTER_NAME_REALM_LENGTH} characters`;
        }
        if (notes.length > TASK_LIMITS.MAX_DESCRIPTION_LENGTH) {
            nextErrors.notes = `Notes can be at most ${TASK_LIMITS.MAX_DESCRIPTION_LENGTH} characters`;
        }
        if (tags.length > TASK_LIMITS.MAX_TAGS_PER_TASK) {
            nextErrors.tags = `Maximum ${TASK_LIMITS.MAX_TAGS_PER_TASK} tags`;
        }
        if (tags.some((tag) => tag.length > TASK_LIMITS.MAX_TAG_LENGTH)) {
            nextErrors.tags = `Each tag can be at most ${TASK_LIMITS.MAX_TAG_LENGTH} characters`;
        }

        return nextErrors;
    }, [name, realm, notes, tags]);

    async function onSubmit(event?: React.FormEvent) {
        event?.preventDefault();

        if (Object.keys(errors).length > 0) {
            pushToast({ type: "error", message: Object.values(errors)[0] });
            return;
        }

        try {
            await onSave({
                name: name.replace(/\s+/g, ""),
                realm: realm.replace(/\s+/g, ""),
                notes: notes.trim(),
                tags,
            });
            onClose();
        } catch (error) {
            pushToast({
                type: "error",
                message: error instanceof Error ? error.message : "Unable to create character",
            });
        }
    }

    return (
        <div className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-character-title"
                className="relative w-100 border border-wow-border bg-wow-ui-background p-4"
            >
                <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3">
                    <CloseButton onClick={onClose} />
                </div>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <h2 id="create-character-title" className="text-xl text-wow-gold">Create Character</h2>
                    <Field id="character-name" label="Name" error={errors.name}>
                        <TextInput id="character-name" labelId="character-name-label" value={name} onChange={setName} />
                    </Field>
                    <Field id="character-realm" label="Realm" error={errors.realm}>
                        <TextInput id="character-realm" labelId="character-realm-label" value={realm} onChange={setRealm} />
                    </Field>
                    <Field id="character-notes" label="Notes" error={errors.notes}>
                        <TextBox id="character-notes" labelId="character-notes-label" value={notes} onChange={setNotes} initialHeight={100} />
                    </Field>
                    <Field id="character-tags" label="Tags" error={errors.tags}>
                        <TagEditor id="character-tags" labelId="character-tags-label" tags={tags} suggestions={DEFAULT_TAGS} onChange={setTags} />
                    </Field>
                    <footer className="flex justify-end mt-2">
                        <Button label="Create Character" disabled={Object.keys(errors).length > 0} onClick={onSubmit} />
                    </footer>
                </form>
            </div>
        </div>
    );
}
