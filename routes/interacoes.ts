import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()

const interacaoSchema = z.object({
  tipo: z.string(),
  conteudo: z.string().optional(),
  nota: z.number().optional(),
  cliente_id: z.string(),
  noticia_id: z.number()
})

// POST /interacoes - Criar nova interação
router.post("/", async (req, res) => {
  const validacao = interacaoSchema.safeParse(req.body)
  if (!validacao.success) {
    res.status(400).json({ erro: validacao.error })
    return
  }

  try {
    if (validacao.data.tipo === "curtida") {
      const curtidaExistente = await prisma.interacao.findFirst({
        where: {
          cliente_id: validacao.data.cliente_id,
          noticia_id: validacao.data.noticia_id,
          tipo: "curtida"
        }
      })

      if (curtidaExistente) {
        res.status(400).json({ erro: "Você já curtiu esta notícia" })
        return
      }
    }

    const interacao = await prisma.interacao.create({
      data: validacao.data,
      include: {
        cliente: { select: { nome: true } },
        noticia: { select: { titulo: true } }
      }
    })

    if (validacao.data.tipo === "curtida") {
      await prisma.noticia.update({
        where: { id: validacao.data.noticia_id },
        data: { curtidas: { increment: 1 } }
      })
    }

    res.status(201).json(interacao)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /interacoes/noticia/:id - Buscar interações de uma notícia
router.get("/noticia/:id", async (req, res) => {
  const { id } = req.params

  try {
    const interacoes = await prisma.interacao.findMany({
      where: { noticia_id: Number(id) },
      include: {
        cliente: {
          select: { nome: true }
        }
      },
      orderBy: { data: 'desc' }
    })

    res.status(200).json(interacoes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /interacoes/cliente/:id - Buscar interações de um cliente
router.get("/cliente/:id", async (req, res) => {
  const { id } = req.params
  
  try {
    const interacoes = await prisma.interacao.findMany({
      where: { cliente_id: id },
      include: {
        noticia: {
          select: {
            id: true,
            titulo: true,
            imagemUrl: true
          }
        }
      },
      orderBy: { data: 'desc' }
    })
    
    res.status(200).json(interacoes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// PUT /interacoes/:id/responder - Responder a uma interação (admin)
router.put("/:id/responder", async (req, res) => {
  const { id } = req.params
  const { resposta } = req.body
  
  try {
    const interacao = await prisma.interacao.update({
      where: { id: Number(id) },
      data: { resposta },
      include: {
        cliente: { select: { nome: true, email: true } },
        noticia: { select: { titulo: true } }
      }
    })
    
    res.status(200).json({ mensagem: "Resposta enviada", interacao })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router