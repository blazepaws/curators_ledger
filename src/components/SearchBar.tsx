export function SearchBar({
    id,
    labelId,
    value,
    onChange,
    placeholder,
    disabled,
}: {
    id?: string;
    labelId?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <div className="relative w-full">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-wow-bright-text/60"
            >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>

            <input
                id={id}
                aria-labelledby={labelId}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`
                    w-full
                    pl-9 pr-3 py-0.5
                    bg-wow-surface
                    border-2 border-wow-border
                    rounded-md
                    text-wow-bright-text
                    placeholder:text-wow-bright-text/60
                    transition
                    enabled:hover:brightness-125
                    focus:outline-none
                    focus:ring-2
                    focus:ring-wow-highlight-border
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                `}
            />
        </div>
    );
}
