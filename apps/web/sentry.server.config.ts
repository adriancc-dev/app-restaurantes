import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // Never log auth tokens on server side either
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>
        if (headers['authorization']) headers['authorization'] = '[Filtered]'
        if (headers['cookie']) headers['cookie'] = '[Filtered]'
      }
      return event
    },
  })
}
