"use client";

import React, { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
// Removed DurationSelector import as it's no longer used here for timer settings
import { toast } from "@/components/ui/use-toast";

const PomodoroTimer: React.FC = () => {
  const {
    currentTaskId,
    tasks, // Now need to access all tasks to get durations of current task
    timerStatus,
    currentSessionType,
    timeLeft,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    nextSession,
  } = usePomodoroStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle the timer countdown
  useEffect(() => {
    if (timerStatus === "running") {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Cleanup on component unmount or status change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerStatus, tick]);

  // Effect to handle session transitions when timeLeft reaches 0
  useEffect(() => {
    if (timeLeft <= 0 && timerStatus === "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // nextSession will handle the toast and state updates
      nextSession();
    }
  }, [timeLeft, timerStatus, nextSession]); // Removed currentSessionType from deps as nextSession handles it

  // Determine the current task title and its specific durations for display
  const currentTask = tasks.find((task) => task.id === currentTaskId);
  const currentTaskTitle = currentTask ? currentTask.title : "No task selected";

  const getSessionDisplay = () => {
    switch (currentSessionType) {
      case "focus":
        return "Focus Session";
      case "roundup":
        return "Roundup Session";
      case "break":
        return "Break Time";
      default:
        return "Ready";
    }
  };

  const handleStartPause = () => {
    if (!currentTaskId) {
      toast({
        title: "No Task Selected",
        description:
          "Please select a task from 'Tasks for Today' to start the Pomodoro timer.",
        variant: "destructive",
      });
      return;
    }

    if (timerStatus === "running") {
      pauseTimer();
      toast({
        title: "Timer Paused",
        description: `The ${currentSessionType} session is paused.`,
      });
    } else {
      startTimer();
      toast({
        title: "Timer Started",
        description: `Starting ${currentSessionType} session for "${currentTaskTitle}".`,
      });
    }
  };

  const handleReset = () => {
    resetTimer();
    toast({
      title: "Timer Reset",
      description:
        "The timer has been reset to the start of the current session type for the selected task.",
    });
  };

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="text-2xl">{getSessionDisplay()}</CardTitle>
        <p className="text-muted-foreground">
          Current Task: {currentTaskTitle}
        </p>
        {currentTask && (
          <p className="text-muted-foreground text-sm">
            Durations: Focus {formatTime(currentTask.focusDuration)} | Roundup{" "}
            {formatTime(currentTask.roundupDuration)} | Break{" "}
            {formatTime(currentTask.breakDuration)}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="text-7xl font-bold tracking-tight">
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-4">
          <Button onClick={handleStartPause}>
            {timerStatus === "running" ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* Duration selectors are now managed within TaskList for task-specific settings */}
        {/* You can add a button here to quickly edit the current task's durations if desired */}
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
