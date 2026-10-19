// A minimal service worker. A service worker is a script the browser runs in
// the background for this site; it's what makes the site count as an
// installable app on some browsers.
//
// This one deliberately does NOT cache pages or data: everything in the app
// is live and personal (today's check-offs), so showing an old saved copy
// would be misleading. It just takes over as soon as it's installed.

self.addEventListener("install", () => {
  // Start using a new version right away instead of waiting for every open
  // tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of pages that are already open.
  event.waitUntil(self.clients.claim());
});
