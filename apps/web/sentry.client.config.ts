import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Never capture sensitive auth fields
    beforeSend(event) {
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>
        for (const key of ['password', 'confirmPassword', 'token', 'access_token', 'refresh_token']) {
          if (key in data) data[key] = '[Filtered]'
        }
      }
      return event
    },
  })
}
