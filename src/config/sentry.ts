import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = (Constants.expoConfig?.extra as any)?.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 10000,
  });
  console.log('[Sentry] Initialized');
} else {
  console.warn('[Sentry] DSN missing - error tracking disabled');
}
