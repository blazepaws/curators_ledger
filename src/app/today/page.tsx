"use client";

import { Checkbox } from '@/components/Checkbox';
import { Combobox } from '@/components/Combobox';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import { Button } from '@/components/Buttons';
import React, { useCallback, useEffect, useState } from 'react';
import { TaskList } from '@/components/TaskList';

import type { TaskData } from '@/types/task';
import { CreateTaskModal, TaskEditData } from '@/components/CreateTaskModal';
import { DEFAULT_TAGS } from '@/lib/tags';
import { useToast } from '@/components/ToastProvider';

enum TaskSortingMethod {
    DailiesAndWeeklies = "Dailies and Weeklies",
    Deadline = "Deadline",
}

interface TaskSortingOptions {
    sortingMethod: TaskSortingMethod;
    ignoreDeadline?: boolean;
}

const ALL_TAGS_OPTION = "All tags";

function TaskSortingOptionsPanel({
    options,
    onChange,
    tagFilter,
    tagOptions,
    onTagFilterChange,
}: {
    options: TaskSortingOptions;
    onChange: (newOptions: TaskSortingOptions) => void;
    tagFilter: string;
    tagOptions: string[];
    onTagFilterChange: (tag: string) => void;
}) {
    return (
        <div className="border border-wow-border p-3 bg-wow-ui-background w-full h-fit max-w-md flex flex-col gap-2">
            <div className="flex justify-between items-baseline gap-2">
                <label id="task-sorting-method-label" htmlFor="task-sorting-method">
                    Sorting Options
                </label>
                <Combobox
                    id="task-sorting-method"
                    labelId="task-sorting-method-label"
                    highlighted={true}
                    options={Object.values(TaskSortingMethod)}
                    selectedOption={options.sortingMethod}
                    onChange={(newMethod) => onChange({ ...options, sortingMethod: newMethod as TaskSortingMethod })}
                    hasShadow={true}
                />
            </div>

            <div className="flex items-baseline justify-between gap-2">
                <label id="today-tag-filter-label" htmlFor="today-tag-filter">
                    Filter by tag
                </label>
                <SearchableCombobox
                    id="today-tag-filter"
                    labelId="today-tag-filter-label"
                    options={tagOptions}
                    selectedOption={tagFilter || ALL_TAGS_OPTION}
                    onChange={(tag) => onTagFilterChange(tag === ALL_TAGS_OPTION ? "" : tag)}
                    placeholder="Select a tag"
                    hasShadow={true}
                />
            </div>

            <div className="flex gap-2 justify-between">
                <Checkbox
                    label="Ignore Deadline"
                    checked={options.ignoreDeadline ?? false}
                    onChange={(e) => onChange({ ...options, ignoreDeadline: e })}
                />
            </div>
        </div>
    );
}

/**
 * Sort tasks based on the selected sorting method and options.
 */
function sortTasks(tasks: TaskData[], options: TaskSortingOptions): TaskData[] {
    switch (options.sortingMethod) {
        case TaskSortingMethod.DailiesAndWeeklies:
            return [...tasks].sort((a, b) => {
                // 1. Prioritize Daily / Weekly tasks.
                // Daily and Weekly get the same priority here.
                const aPriority = a.tags.some(tag => tag === "Daily" || tag === "Weekly" || tag === "Repeatable") ? 0 : 1;
                const bPriority = b.tags.some(tag => tag === "Daily" || tag === "Weekly" || tag === "Repeatable") ? 0 : 1;

                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                // 2. Earlier deadlines first.
                // Tasks without a deadline go last.
                if (!options.ignoreDeadline) {
                    const aDeadline = a.deadline?.getTime() ?? Infinity;
                    const bDeadline = b.deadline?.getTime() ?? Infinity;

                    if (aDeadline !== bDeadline) {
                        return aDeadline - bDeadline;
                    }
                }

                // 3. Keep characters together where possible.
                const aCharacter = `${a.character.realm}:${a.character.name}`.toLowerCase();
                const bCharacter = `${b.character.realm}:${b.character.name}`.toLowerCase();
                if (aCharacter !== bCharacter) {
                    return aCharacter.localeCompare(bCharacter);
                }

                // 4. Finally, sort by task ID for consistent ordering of equally important tasks.
                return a.id - b.id;
            });
        case TaskSortingMethod.Deadline:
            return [...tasks].sort((a, b) => {
                // 1. Earlier deadlines first.
                // Tasks without a deadline go last.
                if (!options.ignoreDeadline) {
                    const aDeadline = a.deadline?.getTime() ?? Infinity;
                    const bDeadline = b.deadline?.getTime() ?? Infinity;

                    if (aDeadline !== bDeadline) {
                        return aDeadline - bDeadline;
                    }
                }

                // 2. Keep characters together where possible.
                const aCharacter = `${a.character.realm}:${a.character.name}`.toLowerCase();
                const bCharacter = `${b.character.realm}:${b.character.name}`.toLowerCase();
                if (aCharacter !== bCharacter) {
                    return aCharacter.localeCompare(bCharacter);
                }

                // 3. Finally, sort by task ID for consistent ordering of equally important tasks.
                return a.id - b.id;
            });
        default:
            // Fallback: Sort by ID for consistency.
            return [...tasks].sort((a, b) => {
                return a.id - b.id;
            });
    }
}

export function useTasks() {
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            const response = await fetch("/api/tasks?active");

            if (!response.ok) {
                throw new Error("Failed to fetch tasks");
            }

            const data = await response.json();

            setTasks(data);
            setError(null);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch tasks"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch immediately.
        fetchTasks();

        // Then periodically check for newly unlocked tasks.
        const interval = setInterval(fetchTasks, 60_000);

        return () => {
            clearInterval(interval);
        };
    }, [fetchTasks]);

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
    };
}

function getStartOfTomorrow(): Date {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
}

export default function Page() {

    // Task querying
    const {
        tasks,
        loading,
        error,
        refetch,
    } = useTasks();

    // Notifications
    const { pushToast } = useToast()

    // Task sorting
    let [sortingOptions, setSortingOptions] = React.useState<TaskSortingOptions>({
        sortingMethod: TaskSortingMethod.DailiesAndWeeklies,
        ignoreDeadline: false,

    });
    const [tagFilter, setTagFilter] = React.useState("");
    const tagOptions = React.useMemo(() => {
        const tags = new Set<string>();
        tasks.forEach((task) => task.tags.forEach((tag) => tags.add(tag)));
        return [ALL_TAGS_OPTION, ...Array.from(tags).sort()];
    }, [tasks]);
    const filteredTasks = React.useMemo(() => {
        if (!tagFilter) return tasks;
        return tasks.filter((task) => task.tags.includes(tagFilter));
    }, [tasks, tagFilter]);
    const sortedTasks = React.useMemo(() => {
        return sortTasks(filteredTasks, sortingOptions);
    }, [filteredTasks, sortingOptions]);

    // Task edit/create 
    const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
    const [editingTaskId, setEditingTaskId] = React.useState<number | null>(null);
    const editingTask = tasks.find((task) => task.id === editingTaskId);

    async function onSaveUpdate(id: number, payload: TaskEditData) {
        const response = await fetch("/api/tasks", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, ...payload }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            pushToast({
                type: "error",
                message: data?.error || "Unable to update task",
            });
            return;
        }

        // Refresh the task list after a successful update
        refetch();
    }

    async function onSaveCreate(payload: TaskEditData) {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            pushToast({
                type: "error",
                message: data?.error || "Unable to create task",
            });
            return;
        }

        // Refresh the task list after a successful creation
        refetch();
    }

    async function deleteTask(id: number) {
        const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            pushToast({
                type: "error",
                message: data?.error || "Unable to delete task",
            });
            return;
        }

        // Refresh the task list after a successful deletion
        refetch();
    }

    async function completeTask(id: number) {
        const response = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            pushToast({
                type: "error",
                message: data?.error || "Unable to complete task",
            });
            return;
        }

        // Refresh the task list after a successful completion
        refetch();
    }

    async function ignoreTask(id: number) {
        // Ignoring a task will set the unlocksAt to tomorrow so the user 
        // won't see it for a day.
        const tomorrow = getStartOfTomorrow();
        const response = await fetch(`/api/tasks/${id}/unlocksAt`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, unlocksAt: tomorrow.toISOString() }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            pushToast({
                type: "error",
                message: data?.error || "Unable to ignore task",
            });
            return;
        }

        // Refresh the task list after a successful ignore
        refetch();
    }

    function editTask(id: number) {
        setEditingTaskId(id);
        setCreateTaskOpen(true);
    }

    function closeTaskModal() {
        setCreateTaskOpen(false);
        setEditingTaskId(null);
    }

    return (
        <>
            <div className="flex flex-col items-center w-full h-full">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full px-6 mt-4">
                    <div></div>
                    <h1 className="text-2xl text-wow-gold m-4">Today's tasks</h1>
                    <div className="flex justify-end gap-2">
                        <Button label="Add Task" onClick={() => {
                            setEditingTaskId(null);
                            setCreateTaskOpen(true);
                        }}></Button>
                    </div>
                </div>
                <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-start gap-8 pt-8">
                    <TaskSortingOptionsPanel
                        options={sortingOptions}
                        onChange={setSortingOptions}
                        tagFilter={tagFilter}
                        tagOptions={tagOptions}
                        onTagFilterChange={setTagFilter}
                    />
                    <TaskList
                        tasks={sortedTasks}
                        options={{
                            displayCharacter: false,
                            displayCompleteButton: true,
                            displayIgnoreButton: true,
                            displayEditButton: true,
                            displayDeleteButton: true
                        }}
                        onComplete={completeTask}
                        onIgnore={ignoreTask}
                        onEdit={editTask}
                        onDelete={deleteTask}
                    />
                </main>
            </div>

            {createTaskOpen && (
                <CreateTaskModal
                    open={true}
                    isUpdating={editingTaskId !== null}
                    prefilledValues={editingTask ? {
                        character: `${editingTask.character.name}-${editingTask.character.realm}`,
                        title: editingTask.title,
                        description: editingTask.description,
                        tags: editingTask.tags,
                        deadline: editingTask.deadline,
                        lockoutType: editingTask.lockoutType ?? "No lockout",
                    } : undefined}
                    onClose={closeTaskModal}
                    onSave={(payload) => editingTaskId === null
                        ? onSaveCreate(payload)
                        : onSaveUpdate(editingTaskId, payload)}
                    availableTags={DEFAULT_TAGS}
                />
            )}
        </>
    )
}