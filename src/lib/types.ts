import { z } from "zod";

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  sessions: TaskSession[];
  // Task-specific durations
  focusDuration: number;
  roundupDuration: number;
  breakDuration: number;
}

export interface TaskSession {
  focusDuration: number; // in seconds
  roundupDuration: number; // in seconds
  breakDuration: number; // in seconds
  startTime: number; // timestamp
  endTime: number; // timestamp
  type: "focus" | "roundup" | "break"; // Type of session completed
}

export interface Settings {
  roundupStartsImmediately: boolean;
  startBreakAutomatically: boolean; // New: Controls automatic break start
}

export interface PomodoroState {
  tasks: Task[]; // All available tasks
  tasksForToday: Task[]; // Tasks selected for the current day
  completedTasks: Task[];
  currentTaskId: string | null;
  focusDurations: number[]; // Global available durations (for adding new tasks)
  roundupDurations: number[]; // Global available durations (for adding new tasks)
  breakDurations: number[]; // Global available durations (for adding new tasks)
  // currentFocusDuration, currentRoundupDuration, currentBreakDuration are now task-specific
  timerStatus: "idle" | "running" | "paused";
  currentSessionType: "focus" | "roundup" | "break";
  timeLeft: number;
  settings: Settings;
  // Temporary state for adding new durations (still relevant for global duration management)
  newFocusDurationInput: string;
  newRoundupDurationInput: string;
  newBreakDurationInput: string;
}

export const defaultSettings: Settings = {
  roundupStartsImmediately: true,
  startBreakAutomatically: false, // Default to manual break start
};

// Form schema for settings page
export const settingsFormSchema = z.object({
  roundupStartsImmediately: z.boolean(),
  startBreakAutomatically: z.boolean(), // New setting in schema
});
