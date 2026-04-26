import { useState, useEffect, useCallback, useRef } from "react";

const PRICES_URL = "https://functions.poehali.dev/52189484-0746-4acc-8694-949dc8ee7f62";
const LS_KEY = "agroport_triggers";
const CHECK_INTERVAL = 5 * 60 * 1000; // проверка каждые 5 минут

export type PushStatus = "unsupported" | "default" | "granted" | "denied";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission as PushStatus;
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setStatus(result as PushStatus);
    return result;
  }, []);

  const sendToSW = useCallback(async (triggers: unknown[], prices: unknown[]) => {
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: "CHECK_TRIGGERS",
      triggers,
      prices,
    });
  }, []);

  const checkNow = useCallback(async () => {
    if (Notification.permission !== "granted") return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      const triggers = raw ? JSON.parse(raw) : [];
      if (!triggers.length) return;

      const res = await fetch(PRICES_URL);
      const data = await res.json();
      const prices = data.prices ?? [];

      await sendToSW(triggers, prices);
    } catch {
      // silent
    }
  }, [sendToSW]);

  // Запускаем периодическую проверку пока разрешение дано
  useEffect(() => {
    if (status !== "granted") return;

    checkNow();
    timerRef.current = setInterval(checkNow, CHECK_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, checkNow]);

  const showTestNotification = useCallback(() => {
    if (Notification.permission !== "granted") return;
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title: "АгроПорт · Тест уведомлений",
      body: "Push-уведомления работают. Вы получите сигнал при срабатывании триггера.",
      tag: "agroport-test",
      url: "/#alerts",
    });
  }, []);

  return { status, requestPermission, checkNow, showTestNotification };
}
