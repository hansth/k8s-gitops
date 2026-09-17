import createClient from 'openapi-fetch'
import type { paths } from '@hansterhorst/openapi'

// Always same-origin: the Vite dev server proxies /api (vite.config.ts) and the
// container's nginx reverse-proxies it too (frontend/nginx.conf.template).
export const client = createClient<paths>({ baseUrl: '/' })