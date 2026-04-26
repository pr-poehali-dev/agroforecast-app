/* АгроПорт — Service Worker v1 */
const CACHE = "agroport-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* ── Push-уведомление от сервера ── */
self.addEventListener("push", (event) => {
  let data = { title: "АгроПорт", body: "Новое событие на агрорынке", icon: "/favicon.svg", tag: "agroport-push", badge: "/favicon.svg" };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || "/favicon.svg",
      badge: data.badge || "/favicon.svg",
      tag:   data.tag   || "agroport-push",
      vibrate: [200, 100, 200],
      data:  { url: data.url || "/" },
    })
  );
});

/* ── Клик по уведомлению ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && "focus" in c) { c.focus(); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

/* ── Периодическая проверка триггеров (Periodic Background Sync) ── */
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "agroport-check") {
    event.waitUntil(checkTriggers());
  }
});

/* ── Сообщения от страницы (ручная проверка) ── */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CHECK_TRIGGERS") {
    checkTriggers(event.data.triggers, event.data.prices);
  }
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const d = event.data;
    self.registration.showNotification(d.title || "АгроПорт", {
      body:    d.body  || "",
      icon:    "/favicon.svg",
      badge:   "/favicon.svg",
      tag:     d.tag   || "agroport-alert",
      vibrate: [150, 75, 150],
      data:    { url: d.url || "/#alerts" },
    });
  }
});

/* ── Логика проверки триггеров ── */
async function checkTriggers(triggers, prices) {
  if (!triggers || !prices) return;

  for (const trigger of triggers) {
    if (!trigger.active) continue;

    if (trigger.type === "price") {
      const priceData = prices.find((p) => p.crop === trigger.crop);
      if (!priceData) continue;

      const fired =
        (trigger.condition === "above" && priceData.price > trigger.threshold) ||
        (trigger.condition === "below" && priceData.price < trigger.threshold);

      if (fired) {
        const dir = trigger.condition === "above" ? "выросла выше" : "упала ниже";
        await self.registration.showNotification("АгроПорт · Ценовой сигнал", {
          body:    `${trigger.crop}: цена ${dir} ${trigger.threshold.toLocaleString("ru")} ₽/т. Текущая: ${priceData.price.toLocaleString("ru")} ₽/т`,
          icon:    "/favicon.svg",
          badge:   "/favicon.svg",
          tag:     `price-${trigger.id}`,
          vibrate: [200, 100, 200],
          data:    { url: "/#forecasts" },
        });
      }
    }

    if (trigger.type === "weather") {
      const riskData = prices && prices.risks && prices.risks.find((r) => r.region === trigger.region);
      if (!riskData) continue;
      const levelMap = { critical: 3, high: 2 };
      const threshold = levelMap[trigger.risk_level] || 2;
      if (riskData.level_num >= threshold) {
        await self.registration.showNotification("АгроПорт · Погодный риск", {
          body:    `${trigger.region}: ${riskData.type} — уровень ${riskData.level}. Проверьте раздел Риски.`,
          icon:    "/favicon.svg",
          badge:   "/favicon.svg",
          tag:     `weather-${trigger.id}`,
          vibrate: [300, 100, 300],
          data:    { url: "/#risks" },
        });
      }
    }
  }
}
