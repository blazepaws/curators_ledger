export function HorizontalField({ id, label, hint, error, children }: { id: string; label: string | null; hint?: string | null; error?: string | null; children: React.ReactNode }) {
    // If the element has no label, we want the input to take the full width of the container.
    return (
        <div className="flex gap-1 flex-col w-full">
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

export function VerticalField({ id, label, hint, error, children }: { id: string; label?: string | null; hint?: string | null; error?: string | null; children: React.ReactNode }) {
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