import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { v1Router } from './routes/v1/index.js'

export function createApp() {
  const app = express()

  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/v1', v1Router)

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err)
      if (err instanceof Error && err.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: err })
        return
      }
      res.status(500).json({ error: 'Internal server error' })
    },
  )

  return app
}
