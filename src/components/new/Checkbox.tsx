export function Checkbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (newChecked: boolean) => void }) {
    return (
        <label className="flex items-center gap-2">
            {label}
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only focus:ring-2 
                        focus:ring-wow-highlight-border"
            />
            <span
            className="
                border-2 border-wow-border rounded-sm
                flex h-5 w-5
                bg-container-background
                shadow-[inset_0_1px_2px_rgba(255,255,255,.2),0_2px_4px_rgba(0,0,0,.6)]
                transition-all
                peer-checked:bg-wow-red
                peer-checked:shadow-[inset_0_2px_3px_rgba(100,100,100,0.45),inset_0_-5px_8px_rgba(20,20,20,0.65),0_3px_6px_rgba(0,0,0,0.7)]
                
            "
            />
        </label>
    )
}

