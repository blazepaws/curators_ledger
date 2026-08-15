import {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

export function SearchableCombobox({
    id,
    labelId,
    placeholder,
    options,
    selectedOption,
    onChange,
    hasShadow = false,
}: {
    id?: string;
    labelId?: string;
    placeholder: string;
    options: string[];
    selectedOption: string;
    onChange: (newOption: string) => void;
    hasShadow?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    id = id ?? useId();
    const listboxId = `${id}-listbox`;

    const getOptionId = (index: number) =>
        `${id}-option-${index}`;

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
    );

    /*
     * Keep the active index valid when the search changes.
     */
    useEffect(() => {
        if (filteredOptions.length === 0) {
            setActiveIndex(0);
            return;
        }

        setActiveIndex((current) =>
            Math.min(current, filteredOptions.length - 1)
        );
    }, [search, options]);

    /*
     * Close when clicking outside.
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                close();
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const open = () => {
        setSearch("");

        const selectedIndex =
            options.indexOf(selectedOption);

        setActiveIndex(
            selectedIndex >= 0 ? selectedIndex : 0
        );

        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setSearch("");
    };

    /*
     * The only way the actual value changes.
     *
     * `option` always comes from `options`, so arbitrary
     * text entered into the search box can never become
     * the selected value.
     */
    const selectOption = (index: number) => {
        const option = filteredOptions[index];

        if (!option) {
            return;
        }

        onChange(option);
        close();

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();

                if (!isOpen) {
                    open();
                    return;
                }

                setActiveIndex((current) =>
                    Math.min(
                        current + 1,
                        filteredOptions.length - 1
                    )
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

                setActiveIndex(
                    Math.max(filteredOptions.length - 1, 0)
                );

                break;

            case "Enter":
                event.preventDefault();

                if (!isOpen) {
                    open();
                    return;
                }

                /*
                 * Enter only selects an actual option.
                 */
                if (filteredOptions[activeIndex]) {
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
     * Scroll active option into view.
     */
    useEffect(() => {
        if (!isOpen || !filteredOptions.length) {
            return;
        }

        const activeOption = document.getElementById(
            getOptionId(activeIndex)
        );

        activeOption?.scrollIntoView({
            block: "nearest",
        });
    }, [activeIndex, isOpen, filteredOptions.length]);

    /*
     * Measure the width of the longest option.
     */
    const [width, setWidth] = useState<number>();

    const measureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (measureRef.current) {
            setWidth(
                measureRef.current.offsetWidth + 30
            );
        }
    }, [options]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-baseline justify-between"
        >
            {/* Hidden element to measure width */}
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
                {/* Search / combobox input */}
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-labelledby={labelId}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-activedescendant={
                        isOpen &&
                        filteredOptions[activeIndex]
                            ? getOptionId(activeIndex)
                            : undefined
                    }
                    value={
                        isOpen
                            ? search
                            : selectedOption
                    }
                    placeholder={
                        isOpen
                            ? placeholder
                            : selectedOption
                              ? undefined
                              : placeholder
                    }
                    onFocus={() => {
                        if (!isOpen) {
                            open();
                        }
                    }}
                    onClick={() => {
                        if (!isOpen) {
                            open();
                        }
                    }}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setActiveIndex(0);

                        if (!isOpen) {
                            setIsOpen(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    className={`
                        min-w-40
                        rounded-md
                        border-2
                        border-wow-border
                        bg-wow-surface
                        px-3
                        py-0.5
                        pr-8
                        text-wow-bright-text
                        placeholder:text-wow-bright-text/60
                        ${hasShadow ? "shadow-[inset_0_2px_3px_rgba(100,100,100,0.45),inset_0_-5px_8px_rgba(20,20,20,0.65),0_3px_6px_rgba(0,0,0,0.7)]" : ""}
                        transition
                        hover:brightness-125
                        focus:outline-none
                        focus:ring-2
                        focus:ring-wow-highlight-border
                    `}
                    style={{ width }}
                />

                {/* Dropdown arrow */}
                <span
                    aria-hidden="true"
                    className={`
                        pointer-events-none
                        absolute
                        right-3
                        top-1/2
                        h-0
                        w-0
                        -translate-y-1/2
                        border-l-[4px]
                        border-r-[4px]
                        border-t-[5px]
                        border-l-transparent
                        border-r-transparent
                        border-t-current
                        transition-transform
                        ${
                            isOpen
                                ? "rotate-180"
                                : ""
                        }
                    `}
                />

                {/* Listbox */}
                {isOpen && (
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={labelId}
                        className="
                            absolute
                            right-0
                            z-50
                            mt-1
                            min-w-full
                            max-h-60
                            overflow-y-auto
                            scrollbar-none
                            rounded-md
                            border-2
                            border-wow-border
                            bg-wow-panel
                            p-1
                            shadow-[0_6px_12px_rgba(0,0,0,0.8)]
                        "
                        style={{ width }}
                    >
                        {filteredOptions.length === 0 ? (
                            <div
                                className="
                                    px-3
                                    py-1
                                    text-wow-bright-text/60
                                "
                            >
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map(
                                (option, index) => {
                                    const isSelected =
                                        option ===
                                        selectedOption;

                                    const isActive =
                                        index ===
                                        activeIndex;

                                    return (
                                        <div
                                            key={option}
                                            id={getOptionId(index)}
                                            role="option"
                                            aria-selected={
                                                isSelected
                                            }
                                            onMouseEnter={() =>
                                                setActiveIndex(
                                                    index
                                                )
                                            }
                                            onMouseDown={(
                                                event
                                            ) => {
                                                event.preventDefault();
                                            }}
                                            onClick={() =>
                                                selectOption(
                                                    index
                                                )
                                            }
                                            className={`
                                                cursor-pointer
                                                rounded
                                                px-3
                                                py-1
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
                                }
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}