
export function TextInput({
    id,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    labelId,
    hasShadow = false,
}: {
    id?: string;
    labelId?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    hasShadow?: boolean;
}) {
    return (
        <input
            id={id}
            aria-labelledby={labelId}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
                px-3 py-0.5
                bg-wow-surface
                border-2 border-wow-border
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
        />
    );
}