import Constants from 'expo-constants';

// Conditional import to avoid dependency issues
let PostHog: any = null;
try {
  PostHog = require('posthog-react-native').default;
} catch (error: any) {
  console.warn(
    '[PostHog] posthog-react-native not available:',
    error?.message || 'Unknown error'
  );
  // Provide fallback constructor
  PostHog = class MockPostHog {
    constructor() {}
    capture() {}
    identify() {}
    reset() {}
  };
}

const apiKey = (Constants.expoConfig?.extra as any)?.POSTHOG_KEY;

export const posthog =
  apiKey && PostHog
    ? new PostHog(apiKey, { host: 'https://app.posthog.com' })
    : {
        capture: () => {},
        identify: () => {},
        reset: () => {},
      };

if (!apiKey) console.warn('[PostHog] API key missing - analytics disabled');
if (!PostHog)
  console.warn('[PostHog] PostHog library not available - analytics disabled');

export const EVENTS = {
  APP_OPEN: 'app_open',
  REMINDER_SCHEDULED: 'reminder_scheduled',
  REMINDER_TAPPED: 'reminder_tapped',
  CHECKIN_SUBMITTED: 'checkin_submitted',
  CHECKIN_FAILED_OFFLINE: 'checkin_failed_offline',
  PUSH_TOKEN_SAVED: 'push_token_saved',
  FAMILY_INVITE_ACCEPTED: 'family_invite_accepted',
} as const;
