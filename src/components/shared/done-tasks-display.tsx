"use client";

import React from "react";
import { usePomodoroStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime, groupTasksByDate } from "@/lib/utils";
import { format } from "date-fns";

const DoneTasksDisplay: React.FC = () => {
  const completedTasks = usePomodoroStore((state) => state.completedTasks);

  const groupedTasks = groupTasksByDate(completedTasks);
  const sortedDates = Array.from(groupedTasks.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  if (completedTasks.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Completed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            No tasks completed yet. Keep up the good work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Completed Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sortedDates.map((dateKey) => {
            const tasksForDate = groupedTasks.get(dateKey) || [];
            return (
              <AccordionItem key={dateKey} value={dateKey}>
                <AccordionTrigger className="text-lg font-semibold">
                  {format(new Date(dateKey), "EEEE, MMMM do, yyyy")} (
                  {tasksForDate.length} tasks)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-4">
                    {tasksForDate.map((task) => {
                      const totalFocusDuration = task.sessions.reduce(
                        (sum, session) => sum + session.focusDuration,
                        0,
                      );
                      const totalRoundupDuration = task.sessions.reduce(
                        (sum, session) => sum + session.roundupDuration,
                        0,
                      );
                      const totalDuration =
                        totalFocusDuration + totalRoundupDuration;

                      return (
                        <Card key={task.id} className="p-4">
                          <h3 className="text-md mb-2 font-bold">
                            {task.title}
                          </h3>
                          <p className="text-muted-foreground mb-4 text-sm">
                            Total Time: {formatTime(totalDuration)} (Focus:{" "}
                            {formatTime(totalFocusDuration)}, Roundup:{" "}
                            {formatTime(totalRoundupDuration)})
                          </p>
                          {task.sessions.length > 0 && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Session Type</TableHead>
                                  <TableHead>Focus</TableHead>
                                  <TableHead>Roundup</TableHead>
                                  <TableHead>Break</TableHead>
                                  <TableHead>Start Time</TableHead>
                                  <TableHead>End Time</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {task.sessions.map((session, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      {session.type.charAt(0).toUpperCase() +
                                        session.type.slice(1)}
                                    </TableCell>
                                    <TableCell>
                                      {formatTime(session.focusDuration)}
                                    </TableCell>
                                    <TableCell>
                                      {formatTime(session.roundupDuration)}
                                    </TableCell>
                                    <TableCell>
                                      {formatTime(session.breakDuration)}
                                    </TableCell>
                                    <TableCell>
                                      {format(
                                        new Date(session.startTime),
                                        "HH:mm",
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {format(
                                        new Date(session.endTime),
                                        "HH:mm",
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DoneTasksDisplay;
