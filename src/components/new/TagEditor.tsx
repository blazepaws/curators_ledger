import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

export function TagEditor({
    id,
    labelId,
    tags,
    suggestions,
    onChange,
    placeholder = "Add a tag...",
    disabled,
}: {
    id?: string;
    labelId?: string;
    tags: string[];
    suggestions: readonly string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const listboxId = `${inputId}-suggestions`;

    const inputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const filteredSuggestions = suggestions.filter((suggestion) => {
        const normalized = suggestion.toLowerCase();

        return (
            normalized.includes(input.trim().toLowerCase()) &&
            !tags.some((tag) => tag.toLowerCase() === normalized)
        );
    });

    useEffect(() => {
        setHighlightedIndex(0);
    }, [input]);

    function addTag(value: string) {
        const tag = value.trim().replace(/,$/, "").trim();

        if (!tag) {
            return;
        }

        // Don't add duplicates.
        if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
            setInput("");
            return;
        }

        onChange([...tags, tag]);
        setInput("");
        setIsOpen(false);
    }

    function removeTag(index: number) {
        onChange(tags.filter((_, i) => i !== index));
        inputRef.current?.focus();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();

            if (filteredSuggestions[highlightedIndex]) {
                addTag(filteredSuggestions[highlightedIndex]);
            } else {
                addTag(input);
            }

            return;
        }

        if (e.key === ",") {
            e.preventDefault();
            addTag(input);
            return;
        }

        if (e.key === "Backspace" && !input && tags.length > 0) {
            removeTag(tags.length - 1);
            return;
        }

        if (e.key === "ArrowDown" && filteredSuggestions.length > 0) {
            e.preventDefault();
            setHighlightedIndex((index) =>
                Math.min(index + 1, filteredSuggestions.length - 1)
            );
            return;
        }

        if (e.key === "ArrowUp" && filteredSuggestions.length > 0) {
            e.preventDefault();
            setHighlightedIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (e.key === "Escape") {
            setIsOpen(false);
        }
    }

    return (
        <div className="relative">
            <div
                className={`
                    flex min-h-10 w-full flex-wrap items-center gap-1.5
                    px-2 py-1
                    bg-wow-surface
                    border-2 border-wow-border
                    rounded-md
                    text-wow-bright-text
                    transition
                    ${disabled ? "opacity-60 cursor-not-allowed" : ""}
                    ${!disabled ? "enabled:hover:brightness-125" : ""}
                    focus-within:outline-none
                    focus-within:ring-2
                    focus-within:ring-wow-highlight-border
                `}
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, index) => (
                    <span
                        key={`${tag}-${index}`}
                        className="
                            inline-flex items-center gap-1
                            rounded-full
                            bg-wow-highlight-border/20
                            px-2.5 py-0.5
                            text-sm
                            whitespace-nowrap
                        "
                    >
                        <span>{tag}</span>

                        <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            disabled={disabled}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(index);
                            }}
                            className="
                                inline-flex h-4 w-4 items-center justify-center
                                rounded-full
                                text-wow-bright-text/70
                                hover:bg-wow-bright-text/20
                                hover:text-wow-bright-text
                                focus:outline-none
                                focus:ring-1
                                focus:ring-wow-highlight-border
                            "
                        >
                            ×
                        </button>
                    </span>
                ))}

                <input
                    ref={inputRef}
                    id={inputId}
                    value={input}
                    disabled={disabled}
                    placeholder={tags.length === 0 ? placeholder : undefined}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (filteredSuggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // Give suggestion clicks time to fire.
                        setTimeout(() => setIsOpen(false), 100);
                    }}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isOpen && filteredSuggestions.length > 0}
                    aria-controls={listboxId}
                    {...(labelId
                        ? { "aria-labelledby": labelId }
                        : { "aria-label": "Tags" })}
                    className="
                        min-w-24 flex-1
                        border-0 bg-transparent
                        px-1 py-0.5
                        text-wow-bright-text
                        placeholder:text-wow-bright-text/60
                        outline-none
                        focus:ring-0
                    "
                />
            </div>

            {isOpen && filteredSuggestions.length > 0 && (
                <ul
                    id={listboxId}
                    role="listbox"
                    className="
                        absolute right-0 z-50 mt-1
                        min-w-full
                        max-h-60
                        overflow-y-auto
                        scrollbar-none
                        rounded-md
                        border-2 border-wow-border
                        bg-wow-panel
                        p-1
                        shadow-[0_6px_12px_rgba(0,0,0,0.8)]
                    "
                >
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            role="option"
                            aria-selected={index === highlightedIndex}
                            onMouseDown={(e) => {
                                // Prevent the input's blur handler from
                                // closing the list before we add the tag.
                                e.preventDefault();
                                addTag(suggestion);
                            }}
                            className={`
                                cursor-pointer
                                rounded px-3 py-1
                                text-left
                                transition
                                hover:bg-wow-red
                                hover:text-wow-bright-text
                            `}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}