import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const apiKey = (Constants.expoConfig?.extra as any)?.POSTHOG_KEY;

export const posthog = apiKey ? new PostHog(apiKey, { host: 'https://app.posthog.com' }) : null;

if (!apiKey) console.warn('[PostHog] API key missing - analytics disabled');

export const EVENTS = {
  APP_OPEN: 'app_open',
  REMINDER_SCHEDULED: 'reminder_scheduled',
  REMINDER_TAPPED: 'reminder_tapped',
  CHECKIN_SUBMITTED: 'checkin_submitted',
  CHECKIN_FAILED_OFFLINE: 'checkin_failed_offline',
  PUSH_TOKEN_SAVED: 'push_token_saved',
  FAMILY_INVITE_ACCEPTED: 'family_invite_accepted',
} as const;


