export function TagDisplay({ tags }: { tags: string[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
                <span key={tag} className="bg-wow-dark-red text-wow-bright-text px-2 py-0.5 text-xs rounded-full">{tag}</span>
            ))}
        </div>
    );
}