"use client";

import React from 'react';
import { TaskCard, TaskCardOptions } from '@/components/TaskCard';
import { CharacterName } from '@/components/CharacterName';

import type { TaskData } from '@/types/task';

export type TaskListProps = {
    tasks: TaskData[];
    options?: TaskCardOptions;
    onComplete?: (taskId: number) => void;
    onIgnore?: (taskId: number) => void;
    onEdit?: (taskId: number) => void;
    onDelete?: (taskId: number) => void;
    draggable?: boolean;
    onDragStart?: (event: React.DragEvent, taskId: number) => void;
};

export function TaskList({ tasks, options, onComplete, onIgnore, onEdit, onDelete, draggable, onDragStart }: TaskListProps) {
    return (
        <div className="flex w-full flex-col items-center gap-4 overflow-y-scroll scrollbar-none pb-8">
            {tasks.map((task, index) => {
                const previousTask = tasks[index - 1];

                const isNewCharacter =
                    index === 0 ||
                    previousTask.character.name !== task.character.name ||
                    previousTask.character.realm !== task.character.realm;

                return (
                    <React.Fragment key={task.id}>
                        {isNewCharacter && (
                            <>
                                <CharacterName
                                    character={task.character}
                                    size="md"
                                />
                            </>
                        )}

                        <div
                            className={`w-full flex justify-center ${draggable ? "cursor-grab" : ""}`}
                            draggable={draggable}
                            onDragStart={draggable && onDragStart ? (e) => onDragStart(e, task.id) : undefined}
                        >
                            <TaskCard
                                task={task}
                                options={options}
                                onComplete={() => onComplete?.(task.id)}
                                onIgnore={() => onIgnore?.(task.id)}
                                onEdit={() => onEdit?.(task.id)}
                                onDelete={() => onDelete?.(task.id)}
                            />
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    )
}
