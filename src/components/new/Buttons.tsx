export function ButtonDone({ onClick }: { onClick?: () => void }) {
    return (
        <button onClick={onClick} className="text-wow-green hover:text-white">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
            </svg>
        </button>
    );
}

export function ButtonEdit({ onClick }: { onClick?: () => void }) {
    return (
        <button onClick={onClick} className="text-wow-gold hover:text-white">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 3.487a2.1 2.1 0 013.651 1.486L8.5 17H5v-3.5L16.862 3.487z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.5 5.5l4 4"
                />
            </svg>
        </button>
    );
}

export function ButtonDelete({ onClick }: { onClick?: () => void }) {
    return (
        <button onClick={onClick} className="text-wow-red hover:text-white">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 11v6M14 11v6"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 7l1 13h10l1-13"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 7V4h6v3"
                />
            </svg>
        </button>
    );
}

export function ButtonSkip({ onClick }: { onClick?: () => void }) {
    return (
        <button onClick={onClick} className="text-wow-gold hover:text-white">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 5l10 7-10 7V5z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 5v14"
                />
            </svg>
        </button>
    );
}

export function CloseButton({
    onClick,
}: {
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Close"
            className="
                flex
                h-7 w-7
                items-center
                justify-center
                rounded-md
                border-2 border-wow-border
                bg-wow-red
                text-wow-bright-text
                shadow-[inset_0_2px_3px_rgba(100,100,100,0.45),inset_0_-5px_8px_rgba(20,20,20,0.65),0_3px_6px_rgba(0,0,0,0.7)]
                transition
                enabled:hover:brightness-125
                focus:outline-none
                focus:ring-2
                focus:ring-wow-highlight-border
            "
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
            >
                <path d="M6 6L18 18" />
                <path d="M18 6L6 18" />
            </svg>
        </button>
    );
}

export function Button({ label, onClick, disabled }: { label: string, onClick: () => void, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="
                px-3 py-0.5
                bg-wow-red
                shadow-[inset_0_2px_3px_rgba(100,100,100,0.45),inset_0_-5px_8px_rgba(20,20,20,0.65),0_3px_6px_rgba(0,0,0,0.7)]
                border-2 border-wow-border rounded-md
                enabled:hover:brightness-125
                text-wow-bright-text
                disabled:opacity-60
            "
        >
            {label}
        </button>
    )
}