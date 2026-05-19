import { createApp } from './app.js'
import { config } from './config.js'

const app = createApp()

app.listen(config.port, () => {
  console.log(`CRM API listening on http://localhost:${config.port}`)
  console.log(`Frontend URL: ${config.frontendUrl}`)
  console.log(`SSO Google: ${config.google.clientId ? 'enabled' : 'disabled'}`)
})
