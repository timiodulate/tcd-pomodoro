"use client";

import React, { useState } from "react";
import { usePomodoroStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, GripVertical, Pen, PlusCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/types";

const TaskList: React.FC = () => {
  const {
    tasks,
    tasksForToday,
    addTask,
    addTaskForToday,
    removeTaskForToday,
    editTask,
    deleteTask,
    selectCurrentTask,
    currentTaskId,
    reorderTasksForToday, // New: for drag and drop reordering
  } = usePomodoroStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingNewTaskFromCombobox, setIsAddingNewTaskFromCombobox] =
    useState(false);
  const [taskToEdit, setTaskToEdit] = useState({ id: "", title: "" });
  const [isEdittingTaskFromCombobox, setIsEdittingTaskFromCombobox] =
    useState(false);

  const setTaskValueInInputAndModalForm = (value: string) => {
    setValue(value);
    setNewTaskTitle(value);
  };
  const updateIsAddingNewTaskFromCombobox = () => {
    setValue("");
    setIsAddingNewTaskFromCombobox(true);
  };

  // Filter tasks that are not yet in tasksForToday
  const availableTasks = tasks.filter(
    (task) => !tasksForToday.some((t) => t.id === task.id),
  );

  const handleSelectTaskForToday = (taskId: string, taskTitle: string) => {
    addTaskForToday(taskId);
    setValue(""); // Clear combobox input
    setOpen(false); // Close combobox
    toast({
      title: "Task Added to Today",
      description: `"${taskTitle}" has been added to your tasks for today.`,
    });
  };

  const checkIfTaskAlreadyExists = () => {
    const existingTask = tasks.find(
      (t) => t.title.toLowerCase() === newTaskTitle.trim().toLowerCase(),
    );

    if (existingTask) {
      toast({
        title: "Task Already Exists",
        description: `"${newTaskTitle}" is already in your main task list.`,
        variant: "destructive",
      });
      setNewTaskTitle("");
      setIsAddingNewTaskFromCombobox(false);
      return;
    }
  };

  const handleAddNewTask = () => {
    if (newTaskTitle.trim()) {
      checkIfTaskAlreadyExists();

      // Add to main tasks
      const newTaskId = addTask(
        newTaskTitle,
        25 * 60, // Default focus
        5 * 60, // Default roundup
        5 * 60, // Default break
      );

      setNewTaskTitle("");
      setIsAddingNewTaskFromCombobox(false);
      setOpen(false); // Close combobox after adding
      toast({
        title: "New Task Added",
        description: `"${newTaskTitle}" has been added.`,
      });
    } else {
      toast({
        title: "Task Title Required",
        description: "Please enter a title for your new task.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewTaskAndAddToToday = () => {
    if (newTaskTitle.trim()) {
      checkIfTaskAlreadyExists();

      // Add to main tasks and get the ID back
      const newTaskId = addTask(
        newTaskTitle,
        25 * 60, // Default focus
        5 * 60, // Default roundup
        5 * 60, // Default break
      );
      // Then add to tasks for today
      addTaskForToday(newTaskId); // Pass the ID of the newly added task

      setNewTaskTitle("");
      setIsAddingNewTaskFromCombobox(false);
      setOpen(false); // Close combobox after adding
      toast({
        title: "New Task Added & Selected",
        description: `"${newTaskTitle}" has been added and selected for today.`,
      });
    } else {
      toast({
        title: "Task Title Required",
        description: "Please enter a title for your new task.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = () => {
    const selectedTaskInitialTitle = tasks.find(
      (task) => task.id == taskToEdit.id,
    )?.title;

    if (taskToEdit.title.trim() != selectedTaskInitialTitle?.trim()) {
      //   checkIfTaskAlreadyExists();

      // Edit in main tasks
      editTask(taskToEdit.id, taskToEdit.title);

      setTaskToEdit({ id: "", title: "" });
      setIsEdittingTaskFromCombobox(false);
      // setOpen(false); // Close combobox after adding

      toast({
        title: "Task Editted",
        description: `"${newTaskTitle}" has been editted.`,
      });
    } else {
      toast({
        title: "Task Title Unchanged",
        description: "Please edit the current title for the task.",
        variant: "destructive",
      });
    }
  };

  const {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragEnd,
    //
    dragOverItemIndex,
    draggedItemIndex,
  } = useDraggable(reorderTasksForToday);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Manage Your Tasks</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Combobox for selecting tasks for today */}
          <Label htmlFor="select-task-for-today">Add Task for Today</Label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {value
                  ? tasks.find((task) => task.title === value)?.title
                  : "Search or add task..."}
                <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput
                  placeholder="Search task or add new..."
                  value={value}
                  onValueChange={setTaskValueInInputAndModalForm}
                />

                <CommandList>
                  <CommandEmpty>
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      <p>No task found.</p>

                      {value && (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={updateIsAddingNewTaskFromCombobox}
                        >
                          Add "{value}" as a new task?
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>

                  <CommandGroup>
                    {availableTasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={task.title}
                        onSelect={() =>
                          handleSelectTaskForToday(task.id, task.title)
                        }
                        className="w-full"
                      >
                        <div className="flex w-full items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              tasksForToday.some((t) => t.id === task.id)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />

                          <div className="flex grow items-center justify-between">
                            <p>{task.title}</p>

                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToEdit({
                                    id: task.id,
                                    title: task.title,
                                  });
                                  setIsEdittingTaskFromCombobox(true);
                                }}
                                title="Edit task"
                              >
                                <Pen className="h-4 w-4 text-gray-700" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                }}
                                title="Delete permanently"
                              >
                                <Trash2 className="text-destructive h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Dialog for adding new task from combobox if not found */}
          <Dialog
            open={isAddingNewTaskFromCombobox}
            onOpenChange={setIsAddingNewTaskFromCombobox}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="new-task-title-combobox"
                    className="text-right"
                  >
                    Task Title
                  </Label>
                  <Input
                    id="new-task-title-combobox"
                    value={newTaskTitle || value} // Pre-fill with current combobox input
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Learn Next.js"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddNewTask}>Add</Button>

                <Button onClick={handleAddNewTaskAndAddToToday}>
                  Add & Select for Today
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for editting existing task from combobox */}
          <Dialog
            open={isEdittingTaskFromCombobox}
            onOpenChange={setIsEdittingTaskFromCombobox}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="new-task-title-combobox"
                    className="text-right"
                  >
                    Task Title
                  </Label>
                  <Input
                    id="new-task-title-combobox"
                    value={taskToEdit.title} // Pre-fill with current combobox input
                    onChange={(e) =>
                      setTaskToEdit((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="col-span-3"
                    placeholder="e.g., Learn Next.js"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleEditTask}>Edit</Button>

                <Button
                  variant={"destructive"}
                  onClick={() => deleteTask(taskToEdit.id)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Separator />

          {/* Tasks for Today List */}
          <h3 className="text-lg font-semibold">
            Tasks for Today ({tasksForToday.length})
          </h3>

          {tasksForToday.length === 0 ? (
            <p className="text-muted-foreground text-center">
              No tasks selected for today.
            </p>
          ) : (
            <ScrollArea className="w-full grow rounded-md border p-4">
              <div className="flex flex-col gap-2">
                {tasksForToday.map((task, index) => (
                  <div
                    key={task.id}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      `draggable-task-item flex items-center justify-between rounded-md p-2`,
                      currentTaskId === task.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                      draggedItemIndex === index
                        ? "border-primary border-2 border-dashed opacity-50"
                        : "",
                      dragOverItemIndex === index && draggedItemIndex !== index
                        ? "border-primary border-2"
                        : "",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical
                        className="text-muted-foreground h-4 w-4 cursor-grab"

                        //   title="Drag to reorder"
                      />

                      <span
                        className={cn(
                          "font-medium",
                          currentTaskId === task.id &&
                            "text-primary-foreground",
                        )}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={
                          currentTaskId === task.id ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => selectCurrentTask(task.id)}
                      >
                        {currentTaskId === task.id ? "Current" : "Set Current"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskForToday(task.id)}
                        title="Remove from today's list"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;

const useDraggable = (reorderTasksForToday: any) => {
  // Drag and Drop states
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(
    null,
  );

  // --- Drag and Drop Handlers ---
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    setDragOverItemIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if leaving the current drag-over item
    // This prevents flickering when moving quickly between items
    if (
      e.relatedTarget &&
      !(e.relatedTarget as HTMLElement).closest(".draggable-task-item")
    ) {
      setDragOverItemIndex(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex !== dropIndex) {
      reorderTasksForToday(dragIndex, dropIndex);
      toast({
        title: "Task Reordered",
        description: "Your tasks for today have been reordered.",
      });
    }
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragEnd,
    //
    dragOverItemIndex,
    draggedItemIndex,
  };
};
