// self.addEventListener("push", (event) => {
//   const data = event.data.json();

//   const options = {
//     body: data.body,
//     icon: data.icon || "/favicon.ico", // Ensure this path exists or use a valid URL
//     badge: "/assets/Home/Fincheck_Inspection.png", // Android status bar icon
//     vibrate: [100, 50, 100],
//     data: {
//       url: data.url || "/"
//     },
//     actions: [{ action: "view", title: "View Report" }]
//   };

//   event.waitUntil(self.registration.showNotification(data.title, options));
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();

//   // Get the URL sent from backend (e.g., "/fincheck-reports/view/123")
//   const relativeUrl = event.notification.data.url;

//   // Construct absolute URL based on current location (IP or Domain)
//   // This ensures it works on localhost, IP, and https://yqms.yaikh.com automatically
//   const fullUrl = new URL(relativeUrl, self.location.origin).href;

//   event.waitUntil(
//     clients
//       .matchAll({ type: "window", includeUncontrolled: true })
//       .then((clientList) => {
//         // 1. Try to find an existing tab open to this app
//         for (const client of clientList) {
//           // If we find a tab matching our origin, focus it and navigate
//           if (
//             client.url.startsWith(self.location.origin) &&
//             "focus" in client
//           ) {
//             return client.focus().then((c) => c.navigate(fullUrl));
//           }
//         }

//         // 2. If no tab found, open a new one
//         if (clients.openWindow) {
//           return clients.openWindow(fullUrl);
//         }
//       })
//   );
// });

self.addEventListener("push", (event) => {
  const data = event.data.json();

  // Check if this is a Critical Notification
  const isCritical =
    data.isCritical === true ||
    (data.title && data.title.includes("CRITICAL")) ||
    (data.title && data.title.includes("Rework PO"));

  const options = {
    body: data.body,
    icon: data.icon || "/assets/Home/Fincheck_Inspection.png",
    badge: "/assets/Home/Fincheck_Inspection.png", // Status bar icon (monochrome preferred usually)

    // VIBRATION: Longer and more aggressive for Critical
    vibrate: isCritical ? [200, 100, 200, 100, 200, 100, 400] : [100, 50, 100],

    // INTERACTION: Keep critical notifications on screen until user clicks
    requireInteraction: isCritical,

    data: {
      url: data.url || "/"
    },
    actions: [{ action: "view", title: "View Report" }],
    tag: data.tag // Prevents stacking if same ID
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Get the URL sent from backend
  const relativeUrl = event.notification.data.url;

  // Construct absolute URL
  const fullUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 1. Try to find an existing tab open to this app
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            return client.focus().then((c) => c.navigate(fullUrl));
          }
        }

        // 2. If no tab found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});
