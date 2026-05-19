import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "thrivebuddy:notifications";
const REMINDER_HOUR = 18; // 6pm local

type Prefs = { enabled: boolean };

function readPrefs(): Prefs {
  if (typeof window === "undefined") return { enabled: false };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "") as Prefs;
  } catch {
    return { enabled: false };
  }
}

function msUntilNextReminder(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(REMINDER_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function useNotifications() {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "default",
  );
  const [enabled, setEnabled] = useState<boolean>(() => readPrefs().enabled);

  // Show a notification (does nothing if not permitted)
  const notify = useCallback((title: string, body?: string) => {
    if (!supported || Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon: "/favicon.ico", tag: "thrivebuddy" });
    } catch {
      /* ignore */
    }
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported) return false;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      setEnabled(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: true }));
      notify("ThriveBuddy reminders on ⚡", "We'll nudge you each day so your streak stays alive.");
      return true;
    }
    return false;
  }, [supported, notify]);

  const disable = useCallback(() => {
    setEnabled(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: false }));
  }, []);

  // Schedule a daily reminder while the tab is open
  useEffect(() => {
    if (!supported || !enabled || permission !== "granted") return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        notify("Your buddy is waiting 🚀", "Crush a quick mission to keep your streak alive!");
        schedule();
      }, msUntilNextReminder());
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [supported, enabled, permission, notify]);

  return { supported, permission, enabled, enable, disable, notify };
}
