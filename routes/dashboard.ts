import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

// GET /dashboard/stats - Estatísticas gerais
router.get("/stats", async (req, res) => {
  try {
    const [
      totalNoticias,
      noticiasPendentes,
      noticiasAprovadas,
      noticiasRejeitadas,
      totalClientes,
      totalInteracoes,
      totalCurtidas,
      totalComentarios
    ] = await Promise.all([
      prisma.noticia.count(),
      prisma.noticia.count({ where: { status: "pendente" } }),
      prisma.noticia.count({ where: { status: "aprovada" } }),
      prisma.noticia.count({ where: { status: "rejeitada" } }),
      prisma.cliente.count(),
      prisma.interacao.count(),
      prisma.interacao.count({ where: { tipo: "curtida" } }),
      prisma.interacao.count({ where: { tipo: "comentario" } })
    ])

    const noticiasPorCategoria = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { noticias: true }
        }
      }
    })

    const noticiasRecentes = await prisma.noticia.findMany({
      take: 5,
      orderBy: { dataPublicacao: 'desc' },
      include: {
        categoria: true,
        cliente: { select: { nome: true } }
      }
    })

    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    const interacoesPorDia = await prisma.$queryRaw`
      SELECT 
        DATE(data) as dia,
        COUNT(*) as total
      FROM "Interacao"
      WHERE data >= ${seteDiasAtras}
      GROUP BY DATE(data)
      ORDER BY dia ASC
    `

    res.status(200).json({
      totalNoticias,
      noticiasPendentes,
      noticiasAprovadas,
      noticiasRejeitadas,
      totalClientes,
      totalInteracoes,
      totalCurtidas,
      totalComentarios,
      noticiasPorCategoria: noticiasPorCategoria.map(cat => ({
        categoria: cat.nome,
        total: cat._count.noticias
      })),
      noticiasRecentes,
      interacoesPorDia
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    res.status(500).json({ erro: error })
  }
})

export default router