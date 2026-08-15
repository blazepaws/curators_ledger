import { TaskData } from "@/types/task";
import { ButtonDelete, ButtonDone, ButtonEdit, ButtonSkip } from "./Buttons";
import { TagDisplay } from "./TagDisplay";
import { CharacterName } from "./CharacterName";

export type TaskCardOptions = {
    displayCharacter?: boolean;
    displayCompleteButton?: boolean;
    displayIgnoreButton?: boolean;
    displayEditButton?: boolean;
    displayDeleteButton?: boolean;
    deadlineWarningThresholdDays?: number;
}

function DeadlineDisplay({ deadline, warningThresholdDays = 7 }: { deadline?: Date | null, warningThresholdDays?: number }) {
    if (!deadline) {
        return (<span/>);
    }
    
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const isWarning = daysUntilDeadline <= warningThresholdDays;
    
    return (
        <span className={`text-xs ${isWarning ? 'text-wow-bright-red' : 'text-wow-muted-text'}`}>
            {deadline.toISOString().split('T')[0]}
        </span>
    );
}

type TaskCardProps = {
    task: TaskData;
    options?: TaskCardOptions;
    onComplete?: () => void;
    onIgnore?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
};

export function TaskCard({ task, options, onComplete, onIgnore, onEdit, onDelete }: TaskCardProps) {
    return (
        <div className="group relative w-300 h-fit max-w-md border border-wow-border p-3 bg-wow-ui-background flex flex-col">
            <div className="flex mb-2">
                <div className="flex-grow pr-2">
                    {/* Title */}
                    <h2 className="font-semibold text-xl w-full">{task.title}</h2>
                    
                    {/* Character name (optional) */}
                    {options?.displayCharacter && (
                        <CharacterName character={task.character} size="xs" />
                    )}
                    {/* Task body */}
                    <p className="mt-2">
                        {task.description}
                    </p>
                </div>
                {/* Controls. Hidden unless hovered. Floating on top of the layout. */}
                <div className="
                    flex flex-col items-end gap-2 
                    opacity-0 transition group-hover:opacity-100
                ">
                    {options?.displayCompleteButton && <ButtonDone onClick={onComplete} />}
                    {options?.displayIgnoreButton && <ButtonSkip onClick={onIgnore} />}
                    {options?.displayEditButton && <ButtonEdit onClick={onEdit} />}
                    {options?.displayDeleteButton && <ButtonDelete onClick={onDelete} />}
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-end justify-between">
                {/* Tags */}
                <TagDisplay tags={task.tags} />
                {/* Deadline */}
                <DeadlineDisplay deadline={task.deadline} warningThresholdDays={options?.deadlineWarningThresholdDays ?? 7} />
            </div>
        </div>
    )
}