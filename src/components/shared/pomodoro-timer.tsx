"use client";

import React, { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import DurationSelector from "./duration-selector";
import { toast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const PomodoroTimer: React.FC = () => {
  const {
    currentTaskId,
    tasksForToday, // Use tasksForToday to find the current task
    timerStatus,
    currentSessionType,
    timeLeft,
    // currentFocusDuration,
    // currentRoundupDuration,
    // currentBreakDuration,
    focusDurations,
    roundupDurations,
    breakDurations,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    nextSession,
    addDuration,
    setCurrentDuration,
    editTaskDurations,
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
      nextSession(); // This will trigger the next session and potentially update timerStatus
      toast({
        title: "Session Completed!",
        description: `Your ${currentSessionType} session has ended.`,
      });
    }
  }, [timeLeft, timerStatus, currentSessionType, nextSession, toast]);

  // Determine the current task title for display
  const currentTask = tasksForToday.find((task) => task.id === currentTaskId); // Find in tasksForToday
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
        "The timer has been reset to the start of the current session type.",
    });
  };

  const handleSaveEditedTask = (
    sessionType: "focus" | "roundup" | "break",
    newDuration: number,
  ) => {
    if (!currentTask) return;

    const getDurationKey = () => {
      switch (sessionType) {
        case "focus":
          return "focusDuration";
        case "roundup":
          return "roundupDuration";
        case "break":
          return "breakDuration";
        default:
          return "Ready";
      }
    };

    editTaskDurations(currentTask.id, { [getDurationKey()]: newDuration });
    // Optionally, update the task title if you add that functionality to editTask
    // editTask(taskToEdit.id, editTaskTitle);
    //   setIsEditingTask(false);
    //   setTaskToEdit(null);
    toast({
      title: "Task Updated",
      description: `The ${sessionType} duration for "${currentTask.title}" has been updated to ${formatTime(newDuration)}.`,
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

      <CardContent className="flex flex-col items-center justify-center gap-6">
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

        {currentTask && (
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="1">
              <AccordionTrigger className="text-md font-semibold">
                Edit Task Durations
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid w-full grid-cols-1 gap-4">
                  <DurationSelector
                    type="focus"
                    currentDuration={currentTask?.focusDuration}
                    availableDurations={focusDurations}
                    onDurationChange={(d) => handleSaveEditedTask("focus", d)}
                    onAddDuration={(d) => addDuration("focus", d)}
                  />
                  <DurationSelector
                    type="roundup"
                    currentDuration={currentTask?.roundupDuration}
                    availableDurations={roundupDurations}
                    onDurationChange={(d) => handleSaveEditedTask("roundup", d)}
                    onAddDuration={(d) => addDuration("roundup", d)}
                  />
                  {/* Simplified break duration selection */}
                  <DurationSelector
                    type="break"
                    currentDuration={currentTask?.breakDuration}
                    availableDurations={breakDurations}
                    onDurationChange={(d) => handleSaveEditedTask("break", d)}
                    onAddDuration={(d) => addDuration("break", d)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
