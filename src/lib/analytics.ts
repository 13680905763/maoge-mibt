export type AnalyticsEventName =
  | "page_view"
  | "profile_completed"
  | "quiz_started"
  | "quiz_resumed"
  | "quiz_checkpoint"
  | "quiz_calibration_added"
  | "quiz_completed"
  | "history_result_opened"
  | "poster_theme_selected"
  | "poster_trial_generated"
  | "poster_downloaded"
  | "result_shared"
  | "product_clicked"
  | "result_feedback"
  | "shared_result_viewed";

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

type StoredAnalyticsEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  timestamp: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    umami?: {
      track: (name: string, payload?: AnalyticsPayload) => void;
    };
  }
}

const storageKey = "maoge:analytics-events";
const maxStoredEvents = 200;

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const event: StoredAnalyticsEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer?.push({ event: name, ...payload });
  window.umami?.track(name, payload);

  try {
    const previous = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as StoredAnalyticsEvent[];
    localStorage.setItem(storageKey, JSON.stringify([...previous, event].slice(-maxStoredEvents)));
  } catch {
    // Analytics must never interrupt the test experience.
  }
}
