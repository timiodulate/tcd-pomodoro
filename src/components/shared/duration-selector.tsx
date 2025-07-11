"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface DurationSelectorProps {
  type: "focus" | "roundup" | "break";
  currentDuration: number;
  availableDurations: number[];
  onDurationChange: (duration: number) => void;
  onAddDuration: (duration: number) => void;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  type,
  currentDuration,
  availableDurations,
  onDurationChange,
  onAddDuration,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDurationInput, setNewDurationInput] = useState("");
  const { toast } = useToast();

  const handleAddNewDuration = () => {
    const durationInSeconds = parseInt(newDurationInput) * 60; // Assuming input is in minutes
    if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
      toast({
        title: "Invalid Duration",
        description:
          "Please enter a valid positive number for duration (in minutes).",
        variant: "destructive",
      });
      return;
    }
    onAddDuration(durationInSeconds);
    onDurationChange(durationInSeconds); // Select the newly added duration
    setNewDurationInput("");
    setIsAddingNew(false);
    toast({
      title: "Duration Added",
      description: `New ${type} duration of ${formatTime(durationInSeconds)} added.`,
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={`${type}-duration`}>
        {type.charAt(0).toUpperCase() + type.slice(1)} Duration
      </Label>
      <div className="flex gap-2">
        <Select
          value={currentDuration.toString()}
          onValueChange={(value) => onDurationChange(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={`Select ${type} duration`} />
          </SelectTrigger>
          <SelectContent>
            {availableDurations.map((duration) => (
              <SelectItem key={duration} value={duration.toString()}>
                {formatTime(duration)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
          <DialogTrigger asChild>
            <Button variant="outline">Add New</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                Add New {type.charAt(0).toUpperCase() + type.slice(1)} Duration
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-duration" className="text-right">
                  Minutes
                </Label>
                <Input
                  id="new-duration"
                  type="number"
                  value={newDurationInput}
                  onChange={(e) => setNewDurationInput(e.target.value)}
                  className="col-span-3"
                  min="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddNewDuration}>Add Duration</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DurationSelector;
