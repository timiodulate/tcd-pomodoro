import { create } from "zustand";
import {
  Task,
  Settings,
  PomodoroState,
  defaultSettings,
  TaskSession,
} from "./types";
import { loadStateFromLocalStorage, saveStateToLocalStorage } from "./utils";

interface PomodoroStore extends PomodoroState {
  // Task Actions
  addTask: (
    title: string,
    focusDuration?: number,
    roundupDuration?: number,
    breakDuration?: number,
  ) => string; // Adds to main tasks list, returns ID
  addTaskForToday: (taskId: string) => void; // Adds to tasksForToday
  removeTaskForToday: (taskId: string) => void; // Removes from tasksForToday
  editTask: (taskId: string, title: string) => void; // Edit chosen task in all lists
  editTaskDurations: (taskId: string, focus: { [a: string]: number }) => void; // New: Edit task's specific durations
  deleteTask: (taskId: string) => void; // Deletes from all lists
  selectCurrentTask: (taskId: string | null) => void; // Renamed from selectTask to avoid confusion
  markTaskCompleted: (taskId: string, sessionData: TaskSession[]) => void;
  moveTaskUp: (taskId: string) => void; // New: Move task up in tasksForToday
  moveTaskDown: (taskId: string) => void; // New: Move task down in tasksForToday
  reorderTasksForToday: (sourceIndex: number, destinationIndex: number) => void; // New: Reorder tasks via drag and drop
  // Duration Actions (still for global available durations)
  addDuration: (type: "focus" | "roundup" | "break", duration: number) => void;
  // setCurrentDuration is now less relevant for active timer, but still useful for initial task setup
  setCurrentDuration: (
    type: "focus" | "roundup" | "break",
    duration: number,
  ) => void;

  // Timer Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void; // Called every second by the timer
  nextSession: () => void; // Transition to next session type

  // Settings Actions
  updateSettings: (newSettings: Partial<Settings>) => void;

  // Hydration
  hydrate: () => void;
}

const initialState: PomodoroState = {
  tasks: [],
  tasksForToday: [], // New state property
  completedTasks: [],
  currentTaskId: null,
  focusDurations: [25 * 60, 30 * 60, 45 * 60], // Default durations in seconds
  roundupDurations: [5 * 60, 10 * 60],
  breakDurations: [5 * 60, 10 * 60, 15 * 60],
  // currentFocusDuration, currentRoundupDuration, currentBreakDuration are removed from global state
  timerStatus: "idle",
  currentSessionType: "focus",
  timeLeft: 0, // Will be set based on selected task
  settings: defaultSettings,
  newFocusDurationInput: "",
  newRoundupDurationInput: "",
  newBreakDurationInput: "",
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  ...initialState,

  // Hydration from local storage
  hydrate: () => {
    if (typeof window !== "undefined") {
      const storedState = loadStateFromLocalStorage();
      if (storedState) {
        set(storedState);
        // Set initial timeLeft based on current session type and loaded durations
        const { currentSessionType, currentTaskId, tasks, settings } =
          storedState;

        let initialTimeLeft = 0;
        const currentTask = tasks.find((t) => t.id === currentTaskId);

        if (currentTask) {
          if (currentSessionType === "focus") {
            initialTimeLeft = currentTask.focusDuration;
          } else if (currentSessionType === "roundup") {
            initialTimeLeft = currentTask.roundupDuration;
          } else if (currentSessionType === "break") {
            initialTimeLeft = currentTask.breakDuration;
          }
        } else {
          // If no task selected or task not found, default to a common focus duration
          initialTimeLeft = storedState.focusDurations[0] || 25 * 60;
        }
        set({ timeLeft: initialTimeLeft });
      } else {
        // If no stored state, set initial timeLeft from default focus duration
        set({ timeLeft: initialState.focusDurations[0] || 25 * 60 });
      }
    }
  },

  addTask: (
    title: string,
    focusDuration?: number,
    roundupDuration?: number,
    breakDuration?: number,
  ) => {
    const newId = crypto.randomUUID();
    set((state) => {
      const newTask: Task = {
        id: newId,
        title,
        isCompleted: false,
        sessions: [],
        focusDuration: focusDuration || state.focusDurations[0] || 25 * 60, // Default to first available or 25 min
        roundupDuration: roundupDuration || state.roundupDurations[0] || 5 * 60, // Default to first available or 5 min
        breakDuration: breakDuration || state.breakDurations[0] || 5 * 60, // Default to first available or 5 min
      };
      const updatedTasks = [...state.tasks, newTask];
      saveStateToLocalStorage({ ...state, tasks: updatedTasks });
      return { tasks: updatedTasks };
    });
    return newId; // Return the ID of the newly added task
  },

  addTaskForToday: (taskId: string) => {
    set((state) => {
      const taskToAdd = state.tasks.find((t) => t.id === taskId);
      if (taskToAdd && !state.tasksForToday.some((t) => t.id === taskId)) {
        const updatedTasksForToday = [...state.tasksForToday, taskToAdd];
        saveStateToLocalStorage({
          ...state,
          tasksForToday: updatedTasksForToday,
        });
        return { tasksForToday: updatedTasksForToday };
      }
      return state;
    });
  },

  removeTaskForToday: (taskId: string) => {
    set((state) => {
      const updatedTasksForToday = state.tasksForToday.filter(
        (t) => t.id !== taskId,
      );
      // If the removed task was the current one, deselect it and reset timer
      let newCurrentTaskId = state.currentTaskId;
      let newTimerStatus = state.timerStatus;
      let newTimeLeft = state.timeLeft;
      let newSessionType = state.currentSessionType;

      if (state.currentTaskId === taskId) {
        newCurrentTaskId = null;
        newTimerStatus = "idle";
        newSessionType = "focus";
        newTimeLeft = state.focusDurations[0] || 25 * 60; // Default to first focus duration
      }

      saveStateToLocalStorage({
        ...state,
        tasksForToday: updatedTasksForToday,
        currentTaskId: newCurrentTaskId,
        timerStatus: newTimerStatus,
        timeLeft: newTimeLeft,
        currentSessionType: newSessionType,
      });
      return {
        tasksForToday: updatedTasksForToday,
        currentTaskId: newCurrentTaskId,
        timerStatus: newTimerStatus,
        timeLeft: newTimeLeft,
        currentSessionType: newSessionType,
      };
    });
  },

  editTask: (taskId: string, title: string) => {
    set((state) => {
      const updateTitle = (task: Task) =>
        task.id === taskId ? { ...task, title } : task;
      const updatedTasks = state.tasks.map(updateTitle);
      const updatedTasksForToday = state.tasksForToday.map(updateTitle);
      const updatedCompletedTasks = state.completedTasks.map(updateTitle);

      const updatedState = {
        ...state,
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        completedTasks: updatedCompletedTasks,
      };
      saveStateToLocalStorage(updatedState);

      return {
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        completedTasks: updatedCompletedTasks,
      };
    });
  },

  editTaskDurations: (
    taskId: string,
    newDurationObj: { [a: string]: number },
  ) => {
    set((state) => {
      const updateDurations = (task: Task) =>
        task.id === taskId
          ? {
              ...task,
              ...newDurationObj,
            }
          : task;

      const updatedTasks = state.tasks.map(updateDurations);
      const updatedTasksForToday = state.tasksForToday.map(updateDurations);

      // If the currently selected task's durations are changed, update timeLeft
      let newTimeLeft = state.timeLeft;
      if (state.currentTaskId === taskId) {
        const currentTask = updatedTasks.find((t) => t.id === taskId);
        if (currentTask) {
          if (state.currentSessionType === "focus") {
            newTimeLeft = currentTask.focusDuration;
          } else if (state.currentSessionType === "roundup") {
            newTimeLeft = currentTask.roundupDuration;
          } else if (state.currentSessionType === "break") {
            newTimeLeft = currentTask.breakDuration;
          }
        }
      }

      const updatedState = {
        ...state,
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        timeLeft: newTimeLeft,
      };
      saveStateToLocalStorage(updatedState);
      return updatedState;
    });
  },

  deleteTask: (taskId: string) => {
    set((state) => {
      const updatedTasks = state.tasks.filter((t) => t.id !== taskId);
      const updatedTasksForToday = state.tasksForToday.filter(
        (t) => t.id !== taskId,
      );
      const updatedCompletedTasks = state.completedTasks.filter(
        (t) => t.id !== taskId,
      ); // Also remove from completed

      let newCurrentTaskId = state.currentTaskId;
      let newTimerStatus = state.timerStatus;
      let newTimeLeft = state.timeLeft;
      let newSessionType = state.currentSessionType;

      if (state.currentTaskId === taskId) {
        newCurrentTaskId = null;
        newTimerStatus = "idle";
        newSessionType = "focus";
        newTimeLeft = state.focusDurations[0] || 25 * 60; // Default to first focus duration
      }

      saveStateToLocalStorage({
        ...state,
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        completedTasks: updatedCompletedTasks,
        currentTaskId: newCurrentTaskId,
        timerStatus: newTimerStatus,
        timeLeft: newTimeLeft,
        currentSessionType: newSessionType,
      });
      return {
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        completedTasks: updatedCompletedTasks,
        currentTaskId: newCurrentTaskId,
        timerStatus: newTimerStatus,
        timeLeft: newTimeLeft,
        currentSessionType: newSessionType,
      };
    });
  },

  selectCurrentTask: (taskId: string | null) => {
    set((state) => {
      let newTimeLeft = state.timeLeft;
      let newSessionType: "focus" | "roundup" | "break" = "focus"; // Always start with focus when selecting a new task

      const selectedTask = state.tasks.find((t) => t.id === taskId);
      if (selectedTask) {
        newTimeLeft = selectedTask.focusDuration;
      } else {
        newTimeLeft = state.focusDurations[0] || 25 * 60; // Fallback
      }

      saveStateToLocalStorage({
        ...state,
        currentTaskId: taskId,
        timeLeft: newTimeLeft,
        currentSessionType: newSessionType,
        timerStatus: "idle", // Always idle when a new task is selected
      });
      return {
        currentTaskId: taskId,
        timeLeft: newTimeLeft,
        currentSessionType: newSessionType,
        timerStatus: "idle",
      };
    });
  },

  markTaskCompleted: (taskId: string, sessionData: TaskSession[]) => {
    set((state) => {
      const taskToCompleteIndex = state.tasks.findIndex((t) => t.id === taskId);
      if (taskToCompleteIndex === -1) return state;

      const taskToComplete = {
        ...state.tasks[taskToCompleteIndex],
        isCompleted: true,
        sessions: sessionData, // Ensure this session data is complete for the task
      };

      // Remove from tasksForToday if it was there
      const updatedTasksForToday = state.tasksForToday.filter(
        (t) => t.id !== taskId,
      );

      // Add to completedTasks
      const updatedCompletedTasks = [...state.completedTasks, taskToComplete];

      // Update main tasks list with completion status (don't remove, just mark completed)
      const updatedTasks = state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, isCompleted: true, sessions: sessionData } // Update sessions in main task list too
          : task,
      );

      // Transition to break after task completion
      const newSessionType: "break" = "break";
      const newTimeLeft = taskToComplete.breakDuration; // Use task's specific break duration
      const newTimerStatus = state.settings.startBreakAutomatically
        ? "running"
        : "idle";

      saveStateToLocalStorage({
        ...state,
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        completedTasks: updatedCompletedTasks,
        currentTaskId: null, // Clear current task after completion
        timerStatus: newTimerStatus,
        currentSessionType: newSessionType,
        timeLeft: newTimeLeft,
      });

      return {
        tasks: updatedTasks,
        tasksForToday: updatedTasksForToday,
        completedTasks: updatedCompletedTasks,
        currentTaskId: null,
        timerStatus: newTimerStatus,
        currentSessionType: newSessionType,
        timeLeft: newTimeLeft,
      };
    });
  },

  moveTaskUp: (taskId: string) => {
    set((state) => {
      const index = state.tasksForToday.findIndex((task) => task.id === taskId);
      if (index > 0) {
        const newTasksForToday = [...state.tasksForToday];
        const [movedTask] = newTasksForToday.splice(index, 1);
        newTasksForToday.splice(index - 1, 0, movedTask);
        saveStateToLocalStorage({ ...state, tasksForToday: newTasksForToday });
        return { tasksForToday: newTasksForToday };
      }
      return state;
    });
  },

  moveTaskDown: (taskId: string) => {
    set((state) => {
      const index = state.tasksForToday.findIndex((task) => task.id === taskId);
      if (index < state.tasksForToday.length - 1 && index !== -1) {
        const newTasksForToday = [...state.tasksForToday];
        const [movedTask] = newTasksForToday.splice(index, 1);
        newTasksForToday.splice(index + 1, 0, movedTask);
        saveStateToLocalStorage({ ...state, tasksForToday: newTasksForToday });
        return { tasksForToday: newTasksForToday };
      }
      return state;
    });
  },

  reorderTasksForToday: (sourceIndex: number, destinationIndex: number) => {
    set((state) => {
      const newTasksForToday = Array.from(state.tasksForToday);
      const [movedTask] = newTasksForToday.splice(sourceIndex, 1);
      newTasksForToday.splice(destinationIndex, 0, movedTask);
      saveStateToLocalStorage({ ...state, tasksForToday: newTasksForToday });
      return { tasksForToday: newTasksForToday };
    });
  },

  addDuration: (type: "focus" | "roundup" | "break", duration: number) => {
    set((state) => {
      let updatedDurations: number[];
      let key: "focusDurations" | "roundupDurations" | "breakDurations";

      switch (type) {
        case "focus":
          key = "focusDurations";
          updatedDurations = [
            ...new Set([...state.focusDurations, duration]),
          ].sort((a, b) => a - b);
          break;
        case "roundup":
          key = "roundupDurations";
          updatedDurations = [
            ...new Set([...state.roundupDurations, duration]),
          ].sort((a, b) => a - b);
          break;
        case "break":
          key = "breakDurations";
          updatedDurations = [
            ...new Set([...state.breakDurations, duration]),
          ].sort((a, b) => a - b);
          break;
      }
      saveStateToLocalStorage({ ...state, [key]: updatedDurations });
      return { [key]: updatedDurations } as Partial<PomodoroState>;
    });
  },

  setCurrentDuration: (
    type: "focus" | "roundup" | "break",
    duration: number,
  ) => {
    // This action is now primarily for updating the *global* lists of available durations,
    // not for setting the current timer's duration directly, as that's task-specific.
    // However, it can still be used to set the *default* duration for new tasks if needed,
    // or to update the selected duration in the DurationSelector components.
    set((state) => {
      let updatedState: Partial<PomodoroState> = {};
      // This logic needs to be re-evaluated. If durations are task-specific,
      // `currentFocusDuration`, `currentRoundupDuration`, `currentBreakDuration`
      // are no longer part of the global state.
      // We'll keep this function for now, but its usage will change.
      // For now, it just updates the temporary input fields or default selections.
      // The actual timer `timeLeft` is set by `selectCurrentTask` and `nextSession`.

      // This function's primary role now is to update the *selected* duration
      // in the duration selectors, which are used when adding/editing tasks.
      // It doesn't directly affect the *running* timer's timeLeft.
      // We will remove the `currentFocusDuration`, etc. from PomodoroState.
      // For now, let's just ensure it doesn't try to update non-existent global state.
      // We'll handle the actual application of durations when a task is selected or a session changes.

      // As per the updated PomodoroState, currentFocusDuration, etc. are removed.
      // This function should probably be removed or refactored.
      // For the purpose of this change, we'll make it a no-op or just update the temporary inputs.
      // Let's remove it from the interface and usage, as durations are task-specific.
      // Re-adding for now, but its purpose is for the DurationSelector component to manage its own state.
      // It will not directly modify the global `currentFocusDuration` etc.
      // The `currentFocusDuration` etc. in the store are now used as *defaults* for new tasks.
      // So, if this function is called, it should update those defaults.

      //!   I commeneted tht below
      //   if (type === "focus") {
      //     updatedState.currentFocusDuration = duration; // This is now a default for *new* tasks
      //   } else if (type === "roundup") {
      //     updatedState.currentRoundupDuration = duration; // This is now a default for *new* tasks
      //   } else if (type === "break") {
      //     updatedState.currentBreakDuration = duration; // This is now a default for *new* tasks
      //   }

      saveStateToLocalStorage({ ...state, ...updatedState });
      return updatedState;
    });
  },

  startTimer: () => {
    set((state) => {
      const currentTask = state.tasks.find((t) => t.id === state.currentTaskId);
      if (!currentTask) {
        console.error("Cannot start timer: No current task selected.");
        return state;
      }

      // Ensure timeLeft is set correctly when starting from idle/paused
      let initialTime = state.timeLeft;
      if (state.timerStatus === "idle") {
        if (state.currentSessionType === "focus") {
          initialTime = currentTask.focusDuration;
        } else if (state.currentSessionType === "roundup") {
          initialTime = currentTask.roundupDuration;
        } else if (state.currentSessionType === "break") {
          initialTime = currentTask.breakDuration;
        }
      }

      if (state.timerStatus === "idle" || state.timerStatus === "paused") {
        saveStateToLocalStorage({
          ...state,
          timerStatus: "running",
          timeLeft: initialTime,
        });
        return { timerStatus: "running", timeLeft: initialTime };
      }
      return state;
    });
  },

  pauseTimer: () => {
    set((state) => {
      if (state.timerStatus === "running") {
        saveStateToLocalStorage({ ...state, timerStatus: "paused" });
        return { timerStatus: "paused" };
      }
      return state;
    });
  },

  resetTimer: () => {
    set((state) => {
      const currentTask = state.tasks.find((t) => t.id === state.currentTaskId);
      let newTimeLeft = 0;
      if (currentTask) {
        if (state.currentSessionType === "focus") {
          newTimeLeft = currentTask.focusDuration;
        } else if (state.currentSessionType === "roundup") {
          newTimeLeft = currentTask.roundupDuration;
        } else if (state.currentSessionType === "break") {
          newTimeLeft = currentTask.breakDuration;
        }
      } else {
        // If no task selected, reset to default focus duration
        newTimeLeft = state.focusDurations[0] || 25 * 60;
      }

      saveStateToLocalStorage({
        ...state,
        timerStatus: "idle",
        timeLeft: newTimeLeft,
        // Keep currentSessionType as is, or reset to 'focus' if appropriate
        // For now, let's reset to 'focus' if no task or if task was completed
        currentSessionType: state.currentTaskId
          ? state.currentSessionType
          : "focus",
      });
      return {
        timerStatus: "idle",
        timeLeft: newTimeLeft,
        currentSessionType: state.currentTaskId
          ? state.currentSessionType
          : "focus",
      };
    });
  },

  tick: () => {
    set((state) => {
      if (state.timerStatus !== "running") {
        return state;
      }

      if (state.timeLeft <= 1) {
        get().nextSession(); // Call nextSession to update state
        return {}; // Return an empty object to satisfy TypeScript's return type for 'set'
      }

      const newState = { timeLeft: state.timeLeft - 1 };
      saveStateToLocalStorage({ ...state, ...newState });
      return newState;
    });
  },

  nextSession: () => {
    set((state) => {
      const currentTask = state.tasks.find((t) => t.id === state.currentTaskId);
      if (!currentTask) {
        // If no task is selected, and a session ends, just go to idle focus
        return {
          currentSessionType: "focus",
          timeLeft: state.focusDurations[0] || 25 * 60,
          timerStatus: "idle",
          currentTaskId: null,
        };
      }

      const sessionData: TaskSession = {
        focusDuration: currentTask.focusDuration,
        roundupDuration: currentTask.roundupDuration,
        breakDuration: currentTask.breakDuration,
        startTime: Date.now() - (state.timeLeft + 1) * 1000, // Approximate start time of the just-finished session
        endTime: Date.now(),
        type: state.currentSessionType,
      };

      let newSessionType: "focus" | "roundup" | "break";
      let newTimeLeft: number;
      let newTimerStatus: "idle" | "running" = "idle";

      if (state.currentSessionType === "focus") {
        // After focus, always go to roundup
        newSessionType = "roundup";
        newTimeLeft = currentTask.roundupDuration;
        newTimerStatus = state.settings.roundupStartsImmediately
          ? "running"
          : "idle";
        // Add current focus session to task's sessions
        currentTask.sessions.push({ ...sessionData, type: "focus" });
      } else if (state.currentSessionType === "roundup") {
        // After roundup, mark task as completed, then go to break
        currentTask.sessions.push({ ...sessionData, type: "roundup" });
        // Mark task completed. This action will handle moving it and resetting currentTaskId
        get().markTaskCompleted(currentTask.id, currentTask.sessions);

        // The state will be updated by markTaskCompleted, so we return an empty object
        // and let the markTaskCompleted trigger the next state.
        return {};
      } else {
        // currentSessionType === 'break'
        // After break, always go back to focus and clear current task
        newSessionType = "focus";
        newTimeLeft = state.focusDurations[0] || 25 * 60; // Default focus duration
        newTimerStatus = "idle"; // Focus usually requires manual start
        // Clear current task after the full cycle (focus -> roundup -> break)
        // This is handled by markTaskCompleted now.
        // If we are here, it means a break just finished, and we are ready for a new task.
        return {
          currentSessionType: newSessionType,
          timeLeft: newTimeLeft,
          timerStatus: newTimerStatus,
          currentTaskId: null, // Ready to select a new task
        };
      }

      saveStateToLocalStorage({
        ...state,
        currentSessionType: newSessionType,
        timeLeft: newTimeLeft,
        timerStatus: newTimerStatus,
      });
      return {
        currentSessionType: newSessionType,
        timeLeft: newTimeLeft,
        timerStatus: newTimerStatus,
      };
    });
  },

  updateSettings: (newSettings: Partial<Settings>) => {
    set((state) => {
      const updatedSettings = { ...state.settings, ...newSettings };
      saveStateToLocalStorage({ ...state, settings: updatedSettings });
      return { settings: updatedSettings };
    });
  },
}));
