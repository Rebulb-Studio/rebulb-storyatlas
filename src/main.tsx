import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import { startQueueAutoDrain } from "./api/writeQueue";
import { onStorageQuota } from "./utils/safeStorage";
import { useUIStore } from "./stores/useUIStore";
import "./app.css";

// Optional: Sentry. Only loaded if the env var is set — keeps the bundle lean in dev.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: Number(import.meta.env.VITE_SENTRY_SAMPLE_RATE ?? "0.1"),
    });
  }).catch(() => { /* Sentry unavailable; proceed without it */ });
}

// Background drain of any queued offline writes from a previous session.
startQueueAutoDrain({
  onFlushed: () => { /* individual flushes are quiet; syncWithBackend surfaces the toast */ },
  onParked: (item) => {
    useUIStore.getState().toast(
      `Write parked after retries: ${item.method} ${item.url}`,
      "error",
    );
  },
});

// Global quota listener — any safeStorage write that hit quota fires a toast once.
onStorageQuota((key) => {
  useUIStore.getState().toast(
    `Browser storage is full (${key}). Your latest change may not be cached locally.`,
    "warning",
  );
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
