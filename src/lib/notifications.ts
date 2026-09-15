"use client";

import { toast } from "sonner";

export { toast };

/** Mutations keep their rejection so callers can retain inline error feedback. */
export async function notifyFailure<T>(title: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    toast.error(title, {
      description: error instanceof Error ? error.message : "Please try again.",
      duration: 8000,
    });
    throw error;
  }
}
