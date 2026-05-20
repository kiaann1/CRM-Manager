import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

/** Read-only product JSON for storefronts / websites (no auth). */
export const publicCatalogRouter = Router()

type SpecRow = { name: string; value: string }

function asSpecRows(raw: unknown): SpecRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const o = row as Record<string, unknown>
      const name = typeof o.name === 'string' ? o.name : ''
      const value = typeof o.value === 'string' ? o.value : ''
      if (!name.trim() && !value.trim()) return null
      return { name: name.trim(), value: value.trim() }
    })
    .filter(Boolean) as SpecRow[]
}

publicCatalogRouter.options('/catalog/:token', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.status(204).end()
})

publicCatalogRouter.get('/catalog/:token', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Cache-Control', 'public, max-age=60')

  const token = String(req.params.token ?? '').trim()
  if (!token || token.length < 16) {
    res.status(404).json({ error: 'Catalog not found' })
    return
  }

  const org = await prisma.organization.findFirst({
    where: { productCatalogToken: token },
    select: {
      id: true,
      name: true,
      products: {
        where: { status: 'active' },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          description: true,
          category: true,
          unitOfMeasure: true,
          barcode: true,
          imageUrl: true,
          specifications: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!org) {
    res.status(404).json({ error: 'Catalog not found' })
    return
  }

  res.json({
    organization: { id: org.id, name: org.name },
    asOf: new Date().toISOString(),
    products: org.products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      unitOfMeasure: p.unitOfMeasure,
      barcode: p.barcode,
      imageUrl: p.imageUrl,
      specifications: asSpecRows(p.specifications),
      updatedAt: p.updatedAt.toISOString(),
    })),
  })
})
