import { useEffect, useId, useRef } from "react";

export function TextBox({
    id,
    labelId,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    hasShadow = false,
    maxHeightPx = 200,
    initialHeight = 40,
    maxCharacters,
}: {
    id?: string;
    labelId?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    hasShadow?: boolean;
    maxHeightPx?: number;
    initialHeight?: number;
    maxCharacters?: number;
}) {

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    id = id ?? useId();

    function resizeTextarea() {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset first so it can shrink when text is removed.
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeightPx)}px`;
    }

    useEffect(() => {
        resizeTextarea();
    }, [value, maxHeightPx]);

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        onChange(e.currentTarget.value);
    }
    
    const isOverCharacterLimit = maxCharacters !== undefined && value.length > maxCharacters;

    return (
        <div className="relative w-full">
            <textarea
                id={id}
                value={value}
                onChange={handleChange}
                ref={textareaRef}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                {...(labelId ? { "aria-labelledby": labelId } : {})}
                className={`
                    px-3 py-0.5
                    ${maxCharacters !== undefined ? "pb-5" : ""}
                    bg-wow-surface
                    border-2 border-wow-border
                    block w-full resize-none
                    overflow-y-auto
                    rounded-md
                    text-wow-bright-text
                    placeholder:text-wow-bright-text/60
                    ${hasShadow ? "shadow-[inset_0_2px_3px_rgba(100,100,100,0.45),inset_0_-5px_8px_rgba(20,20,20,0.65),0_3px_6px_rgba(0,0,0,0.7)]" : ""}
                    transition
                    enabled:hover:brightness-125
                    focus:outline-none
                    focus:ring-2
                    focus:ring-wow-highlight-border
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                `}
                style={{ maxHeight: maxHeightPx, height: initialHeight }}
            />
            {maxCharacters !== undefined && (
                <span className={`pointer-events-none absolute right-3 bottom-1 text-xs ${isOverCharacterLimit ? "text-wow-red" : "text-wow-muted-text"}`}>
                    {value.length}/{maxCharacters}
                </span>
            )}
        </div>
    );
}