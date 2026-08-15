import React, { useEffect, useId, useRef, useState } from "react";

export function Combobox({
    id,
    labelId,
    highlighted,
    options,
    selectedOption,
    onChange,
    hasShadow = false,
}: {
    id?: string;
    labelId?: string;
    highlighted?: boolean;
    options: string[];
    selectedOption: string;
    onChange: (newOption: string) => void;
    hasShadow?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Which option the keyboard is currently pointing at.
    const [activeIndex, setActiveIndex] = useState(() =>
        Math.max(options.indexOf(selectedOption), 0)
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    id = id ?? useId();
    const listboxId = `${id}-listbox`;

    const getOptionId = (index: number) => `${id}-option-${index}`;

    /*
     * Keep activeIndex synchronized if the selected option
     * changes externally.
     */
    useEffect(() => {
        const selectedIndex = options.indexOf(selectedOption);

        if (selectedIndex >= 0) {
            setActiveIndex(selectedIndex);
        }
    }, [selectedOption, options]);

    /*
     * Close when clicking outside.
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    /*
     * Open the dropdown and point at the currently selected option.
     */
    const open = () => {
        const selectedIndex = options.indexOf(selectedOption);

        setActiveIndex(
            selectedIndex >= 0 ? selectedIndex : 0
        );

        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

    const selectOption = (index: number) => {
        const option = options[index];

        if (!option) {
            return;
        }

        onChange(option);
        setActiveIndex(index);
        close();

        // Return focus to the combobox after selection.
        requestAnimationFrame(() => {
            buttonRef.current?.focus();
        });
    };

    /*
     * Keyboard interaction.
     */
    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();

                if (!isOpen) {
                    open();
                    return;
                }

                setActiveIndex((current) =>
                    Math.min(current + 1, options.length - 1)
                );
                break;

            case "ArrowUp":
                event.preventDefault();

                if (!isOpen) {
                    open();
                    return;
                }

                setActiveIndex((current) =>
                    Math.max(current - 1, 0)
                );
                break;

            case "Home":
                if (!isOpen) {
                    return;
                }

                event.preventDefault();
                setActiveIndex(0);
                break;

            case "End":
                if (!isOpen) {
                    return;
                }

                event.preventDefault();
                setActiveIndex(options.length - 1);
                break;

            case "Enter":
            case " ":
                event.preventDefault();

                if (!isOpen) {
                    open();
                } else {
                    selectOption(activeIndex);
                }

                break;

            case "Escape":
                if (isOpen) {
                    event.preventDefault();
                    close();
                }
                break;

            case "Tab":
                close();
                break;
        }
    };

    /*
     * If the active option changes while the dropdown is open,
     * scroll it into view.
     */
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const activeOption = document.getElementById(
            getOptionId(activeIndex)
        );

        activeOption?.scrollIntoView({
            block: "nearest",
        });
    }, [activeIndex, isOpen]);

    /* Measure the width of the options to fit the container to the longest option. */
    const [width, setWidth] = useState<number>();
    const measureRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (measureRef.current) {
            setWidth(measureRef.current.offsetWidth + 30);
        }
    }, [options]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-baseline justify-between"
        >
            {/* Hidden element to measure the width of the longest option */}
            <div
                ref={measureRef}
                className="
                    absolute
                    invisible
                    whitespace-nowrap
                    px-3
                    py-1
                    font-inherit
                "
            >
                {options.map((option) => (
                    <div key={option}>
                        {option}
                    </div>
                ))}
            </div>

            <div className="relative">
                {/* Combobox trigger */}
                <button
                    ref={buttonRef}
                    type="button"
                    role="combobox"
                    aria-labelledby={labelId}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-activedescendant={
                        isOpen
                            ? getOptionId(activeIndex)
                            : undefined
                    }
                    onClick={() => {
                        if (isOpen) {
                            close();
                        } else {
                            open();
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    className={`
                        flex min-w-40 items-center justify-between gap-4
                        rounded-md border-2 border-wow-border
                        ${highlighted ? "bg-wow-red" : ""}
                        px-3 py-0.5
                        text-wow-bright-text
                        ${hasShadow ? "shadow-[inset_0_2px_3px_rgba(100,100,100,0.45),inset_0_-5px_8px_rgba(20,20,20,0.65),0_3px_6px_rgba(0,0,0,0.7)]" : ""}
                        transition
                        hover:brightness-125
                        focus:outline-none
                        focus:ring-2 
                        focus:ring-wow-highlight-border
                    `}
                    style={{ width }}
                >
                    <span>{selectedOption}</span>

                    <span
                        aria-hidden="true"
                        className={`
                            block
                            h-0 w-0
                            border-l-[4px] border-r-[4px]
                            border-t-[5px]
                            border-l-transparent
                            border-r-transparent
                            border-t-current
                            transition-transform
                            origin-center
                            ${isOpen ? "rotate-180" : ""}
                        `}
                    />
                </button>

                {/* Listbox */}
                {isOpen && (
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={labelId}
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
                        style={{ width }}
                    >
                        {options.map((option, index) => {
                            const isSelected =
                                option === selectedOption;

                            const isActive =
                                index === activeIndex;

                            return (
                                <div
                                    key={option}
                                    id={getOptionId(index)}
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseEnter={() =>
                                        setActiveIndex(index)
                                    }
                                    onMouseDown={(event) => {
                                        // Prevent the combobox button
                                        // from losing focus before
                                        // selection happens.
                                        event.preventDefault();
                                    }}
                                    onClick={() =>
                                        selectOption(index)
                                    }
                                    className={`
                                        cursor-pointer
                                        rounded px-3 py-1
                                        text-left
                                        transition
                                        ${
                                            isActive
                                                ? "bg-wow-red text-wow-bright-text"
                                                : ""
                                        }
                                    `}
                                >
                                    {option}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}