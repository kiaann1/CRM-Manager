import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { ZodError } from 'zod'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { publicCatalogRouter } from './routes/publicCatalog.js'
import { v1Router } from './routes/v1/index.js'

export function createApp() {
  const app = express()

  app.use(helmet({ contentSecurityPolicy: false }))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/public')) {
      return next()
    }
    cors({ origin: config.frontendUrl, credentials: true })(req, res, next)
  })
  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' })
  })

  app.use(
    '/api/public',
    (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      next()
    },
    publicCatalogRouter,
  )
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
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: err.flatten() })
        return
      }
      const message =
        config.nodeEnv === 'development' && err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ error: message })
    },
  )

  return app
}
