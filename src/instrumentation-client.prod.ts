// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// Off unless this deployment names its own Sentry project (the upstream default sent this
// site's errors and session replays to ChurchApps' Sentry). The SDK is imported only when
// a DSN is set, so pages without one do not download it (it was ~400 KB on every page).

type SentryModule = typeof import("@sentry/nextjs");

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
let sentry: SentryModule | null = null;

if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    sentry = Sentry;
    Sentry.init({
      dsn,
      integrations: [Sentry.replayIntegration()],
      tracesSampleRate: 1,
      enableLogs: true,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: true
    });
  });
}

export const onRouterTransitionStart: SentryModule["captureRouterTransitionStart"] = (...args) => {
  sentry?.captureRouterTransitionStart(...args);
};
