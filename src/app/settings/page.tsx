"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { usePomodoroStore } from "@/lib/store";
import { settingsFormSchema } from "@/lib/types";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import z from "zod";

export default function SettingsPage() {
  const { settings, updateSettings } = usePomodoroStore();

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      roundupStartsImmediately: settings.roundupStartsImmediately,
      startBreakAutomatically: settings.startBreakAutomatically, // Initialize new setting
    },
  });

  // Update form default values when settings from store change (e.g., on hydrate)
  useEffect(() => {
    form.reset({
      roundupStartsImmediately: settings.roundupStartsImmediately,
      startBreakAutomatically: settings.startBreakAutomatically, // Reset new setting
    });
  }, [settings, form]);

  function onSubmit(values: z.infer<typeof settingsFormSchema>) {
    updateSettings(values);
    toast({
      title: "Settings Saved!",
      description: "Your Pomodoro settings have been updated.",
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Pomodoro Settings</CardTitle>
        <CardDescription>
          Configure your Pomodoro clock behavior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="roundupStartsImmediately"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Roundup Starts Immediately</FormLabel>
                    <FormDescription>
                      If enabled, the roundup timer starts automatically when
                      the focus session ends. Otherwise, it waits for you to
                      manually start it.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* New: Start Break Automatically Setting */}
            <FormField
              control={form.control}
              name="startBreakAutomatically"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Start Break Automatically</FormLabel>
                    <FormDescription>
                      If enabled, the break timer starts automatically when a
                      task's focus and roundup sessions are completed.
                      Otherwise, it waits for you to manually start the break.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Removed defaultBreakDuration as it's now task-specific */}
            {/* The global break durations are now only for adding new tasks/editing existing ones */}

            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
