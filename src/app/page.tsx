"use client";

import PomodoroTimer from "@/components/shared/pomodoro-timer";
import TaskList from "@/components/shared/task-list";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-8 p-4 md:flex-row">
      <TaskList />
      <PomodoroTimer />
    </div>
  );
}
