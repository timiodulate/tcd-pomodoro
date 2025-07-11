import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { PomodoroState, Settings, Task } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a time in seconds into MM:SS format.
 * @param seconds The total number of seconds.
 * @returns A string in MM:SS format.
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Loads the entire Pomodoro state from local storage.
 * @returns The loaded state or null if not found/invalid.
 */
export function loadStateFromLocalStorage(): PomodoroState | null {
  try {
    const serializedState = localStorage.getItem("pomodoro_state");
    if (serializedState === null) {
      return null;
    }
    const state: PomodoroState = JSON.parse(serializedState);
    // Ensure all necessary fields exist, provide defaults if missing
    return {
      ...state,
      tasks: state.tasks || [],
      tasksForToday: state.tasksForToday || [], // Initialize tasksForToday
      completedTasks: state.completedTasks || [],
      focusDurations: state.focusDurations || [25 * 60, 30 * 60, 45 * 60],
      roundupDurations: state.roundupDurations || [5 * 60, 10 * 60],
      breakDurations: state.breakDurations || [5 * 60, 10 * 60, 15 * 60],
      settings: state.settings || {
        roundupStartsImmediately: true,
        useSameBreakDuration: true,
        breakAfterFocus: 5 * 60,
        breakAfterRoundup: 15 * 60,
      },
      newFocusDurationInput: "",
      newRoundupDurationInput: "",
      newBreakDurationInput: "",
    };
  } catch (error) {
    console.error("Error loading state from local storage:", error);
    return null;
  }
}

/**
 * Saves the entire Pomodoro state to local storage.
 * @param state The state to save.
 */
export function saveStateToLocalStorage(state: PomodoroState): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("pomodoro_state", serializedState);
  } catch (error) {
    console.error("Error saving state to local storage:", error);
  }
}

/**
 * Groups completed tasks by date.
 * @param tasks An array of completed tasks.
 * @returns A Map where keys are formatted dates (e.g., "YYYY-MM-DD") and values are arrays of tasks for that date.
 */
export function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>();
  tasks.forEach((task) => {
    // Assuming the last session's end time determines the completion date
    const lastSession = task.sessions[task.sessions.length - 1];
    if (lastSession) {
      const dateKey = format(new Date(lastSession.endTime), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(task);
    }
  });
  return grouped;
}
