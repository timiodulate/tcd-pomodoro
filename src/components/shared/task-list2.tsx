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
import {
  Check,
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit,
  X,
} from "lucide-react"; // Added Edit icon
import { cn, formatTime } from "@/lib/utils"; // Import formatTime
import { Task } from "@/lib/types";
import DurationSelector from "./duration-selector"; // Re-introduce for task-specific duration editing

const TaskList: React.FC = () => {
  const {
    tasks,
    tasksForToday,
    addTask,
    addTaskForToday,
    removeTaskForToday,
    deleteTask,
    selectCurrentTask,
    currentTaskId,
    moveTaskUp,
    moveTaskDown,
    editTaskDurations, // New: for editing task durations
    focusDurations, // Global available durations for selectors
    roundupDurations,
    breakDurations,
  } = usePomodoroStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingNewTaskFromCombobox, setIsAddingNewTaskFromCombobox] =
    useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editFocusDuration, setEditFocusDuration] = useState(0);
  const [editRoundupDuration, setEditRoundupDuration] = useState(0);
  const [editBreakDuration, setEditBreakDuration] = useState(0);
  const [editTaskTitle, setEditTaskTitle] = useState("");

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

  const handleAddNewTaskAndAddToToday = async () => {
    if (newTaskTitle.trim()) {
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

      // Add to main tasks and get the ID back
      const newTaskId = addTask(
        newTaskTitle,
        focusDurations[0] || 25 * 60, // Default focus
        roundupDurations[0] || 5 * 60, // Default roundup
        breakDurations[0] || 5 * 60, // Default break
      );

      // Then add to tasks for today using the returned ID
      addTaskForToday(newTaskId);

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

  const openEditTaskDialog = (task: Task) => {
    setTaskToEdit(task);
    setEditTaskTitle(task.title);
    setEditFocusDuration(task.focusDuration);
    setEditRoundupDuration(task.roundupDuration);
    setEditBreakDuration(task.breakDuration);
    setIsEditingTask(true);
  };

  const handleSaveEditedTask = () => {
    if (taskToEdit) {
      editTaskDurations(
        taskToEdit.id,
        editFocusDuration,
        editRoundupDuration,
        editBreakDuration,
      );
      // Optionally, update the task title if you add that functionality to editTask
      // editTask(taskToEdit.id, editTaskTitle);
      setIsEditingTask(false);
      setTaskToEdit(null);
      toast({
        title: "Task Updated",
        description: `"${editTaskTitle}" durations have been updated.`,
      });
    }
  };

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
                  onValueChange={setValue}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      No task found.
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => setIsAddingNewTaskFromCombobox(true)}
                      >
                        Add "{value}" as a new task?
                      </Button>
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
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            tasksForToday.some((t) => t.id === task.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {task.title}
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
                {/* Default duration selectors for new task */}
                <DurationSelector
                  type="focus"
                  currentDuration={focusDurations[0] || 25 * 60}
                  availableDurations={focusDurations}
                  onDurationChange={(d) => {
                    /* Not directly updating store here, just for display */
                  }}
                  onAddDuration={(d) => addTask("", d)} // Add to global list
                />
                <DurationSelector
                  type="roundup"
                  currentDuration={roundupDurations[0] || 5 * 60}
                  availableDurations={roundupDurations}
                  onDurationChange={(d) => {
                    /* Not directly updating store here, just for display */
                  }}
                  onAddDuration={(d) => addTask("", undefined, d)} // Add to global list
                />
                <DurationSelector
                  type="break"
                  currentDuration={breakDurations[0] || 5 * 60}
                  availableDurations={breakDurations}
                  onDurationChange={(d) => {
                    /* Not directly updating store here, just for display */
                  }}
                  onAddDuration={(d) => addTask("", undefined, undefined, d)} // Add to global list
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddNewTaskAndAddToToday}>
                  Add & Select for Today
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for editing existing task durations */}
          <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  Edit Task Durations: {taskToEdit?.title}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <DurationSelector
                  type="focus"
                  currentDuration={editFocusDuration}
                  availableDurations={focusDurations}
                  onDurationChange={setEditFocusDuration}
                  onAddDuration={(d) => addTask("", d)} // Add to global list
                />
                <DurationSelector
                  type="roundup"
                  currentDuration={editRoundupDuration}
                  availableDurations={roundupDurations}
                  onDurationChange={setEditRoundupDuration}
                  onAddDuration={(d) => addTask("", undefined, d)} // Add to global list
                />
                <DurationSelector
                  type="break"
                  currentDuration={editBreakDuration}
                  availableDurations={breakDurations}
                  onDurationChange={setEditBreakDuration}
                  onAddDuration={(d) => addTask("", undefined, undefined, d)} // Add to global list
                />
              </div>
              <DialogFooter>
                <Button onClick={handleSaveEditedTask}>Save Changes</Button>
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
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="flex flex-col gap-2">
                {tasksForToday.map((task, index) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between rounded-md p-2 ${
                      currentTaskId === task.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        currentTaskId === task.id && "text-primary-foreground",
                      )}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={
                          currentTaskId === task.id ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => selectCurrentTask(task.id)}
                      >
                        {currentTaskId === task.id ? "Current" : "Set Current"}
                      </Button>
                      {/* Edit button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTaskDialog(task)}
                        title="Edit task durations"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* Reorder buttons */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveTaskUp(task.id)}
                        disabled={index === 0}
                        title="Move task up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveTaskDown(task.id)}
                        disabled={index === tasksForToday.length - 1}
                        title="Move task down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskForToday(task.id)}
                        title="Remove from today's list"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        title="Delete permanently"
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
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
