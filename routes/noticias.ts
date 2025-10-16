import { Prisma, PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()

const noticiaSchema = z.object({
  titulo: z.string().min(5),
  resumo: z.string().min(10),
  conteudo: z.string().min(50),
  imagemUrl: z.string().url(),
  autor: z.string().min(2),
  categoria_id: z.number(),
  cliente_id: z.string()
})

// GET /noticias - Listar notícias aprovadas
router.get("/", async (req, res) => {
  try {
    const noticias = await prisma.noticia.findMany({
      where: { status: "aprovada" },
      include: { categoria: true, cliente: { select: { nome: true } } },
      orderBy: { dataPublicacao: 'desc' }
    })
    res.status(200).json(noticias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /noticias/pendentes - Listar notícias pendentes (apenas admin)
router.get("/pendentes", async (req, res) => {
  try {
    const noticias = await prisma.noticia.findMany({
      where: { status: "pendente" },
      include: { 
        categoria: true, 
        cliente: { select: { nome: true, email: true } } 
      },
      orderBy: { dataPublicacao: 'desc' }
    })
    res.status(200).json(noticias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /noticias/minhas/:clienteId - Listar notícias do cliente
router.get("/minhas/:clienteId", async (req, res) => {
  const { clienteId } = req.params
  
  try {
    const noticias = await prisma.noticia.findMany({
      where: { cliente_id: clienteId },
      include: { categoria: true },
      orderBy: { dataPublicacao: 'desc' }
    })
    res.status(200).json(noticias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /noticias/pesquisa/:termo - Pesquisar notícias aprovadas
router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params
  
  try {
    const noticias = await prisma.noticia.findMany({
      where: {
        AND: [
          { status: "aprovada" },
          {
            OR: [
              { titulo: { contains: termo, mode: 'insensitive' } },
              { resumo: { contains: termo, mode: 'insensitive' } },
              { autor: { contains: termo, mode: 'insensitive' } },
              { categoria: { nome: { contains: termo, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: { categoria: true },
      orderBy: { dataPublicacao: 'desc' }
    })
    
    res.status(200).json(noticias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /noticias/:id - Buscar notícia por ID (apenas aprovadas)
router.get("/:id", async (req, res) => {
  const { id } = req.params

  if (isNaN(Number(id))) {
    res.status(400).json({ erro: "ID deve ser um número" })
    return
  }

  try {
    const noticia = await prisma.noticia.findUnique({
      where: { 
        id: Number(id),
        status: "aprovada"
      },
      include: { 
        categoria: true,
        cliente: { select: { nome: true } },
        interacoes: {
          include: {
            cliente: {
              select: { nome: true }
            }
          },
          orderBy: { data: 'desc' }
        }
      }
    })

    if (!noticia) {
      res.status(404).json({ erro: "Notícia não encontrada" })
      return
    }

    // Incrementar visualizações
    await prisma.noticia.update({
      where: { id: Number(id) },
      data: { visualizacoes: { increment: 1 } }
    })

    const noticiaAtualizada = {
      ...noticia,
      visualizacoes: noticia.visualizacoes + 1
    }

    res.status(200).json(noticiaAtualizada)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// POST /noticias - Criar nova notícia (status pendente)
router.post("/", async (req, res) => {
  const validacao = noticiaSchema.safeParse(req.body)
  if (!validacao.success) {
    res.status(400).json({ erro: validacao.error })
    return
  }

  try {
    const novaNoticia = await prisma.noticia.create({
      data: {
        titulo: validacao.data.titulo,
        resumo: validacao.data.resumo,
        conteudo: validacao.data.conteudo,
        imagemUrl: validacao.data.imagemUrl,
        autor: validacao.data.autor,
        status: "pendente",
        categoria: {
          connect: { id: validacao.data.categoria_id }
        },
        cliente: {
          connect: { id: validacao.data.cliente_id }
        }
      } as unknown as Prisma.NoticiaUncheckedCreateInput
    })
    res.status(201).json(novaNoticia)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// PUT /noticias/:id/aprovar - Aprovar notícia (apenas admin)
router.put("/:id/aprovar", async (req, res) => {
  const { id } = req.params
  
  try {
    const noticia = await prisma.noticia.update({
      where: { id: Number(id) },
      data: { 
        status: "aprovada",
        motivo_rejeicao: null
      },
      include: { categoria: true, cliente: { select: { nome: true } } }
    })
    
    res.status(200).json({ mensagem: "Notícia aprovada com sucesso", noticia })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// PUT /noticias/:id/rejeitar - Rejeitar notícia (apenas admin)
router.put("/:id/rejeitar", async (req, res) => {
  const { id } = req.params
  const { motivo } = req.body
  
  try {
    const noticia = await prisma.noticia.update({
      where: { id: Number(id) },
      data: { 
        status: "rejeitada",
        motivo_rejeicao: motivo || "Não aprovada pela moderação"
      },
      include: { categoria: true, cliente: { select: { nome: true } } }
    })
    
    res.status(200).json({ mensagem: "Notícia rejeitada", noticia })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// DELETE /noticias/:id - Excluir notícia
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  
  try {
    await prisma.interacao.deleteMany({
      where: { noticia_id: Number(id) }
    })

    await prisma.noticia.delete({
      where: { id: Number(id) }
    })

    res.status(200).json({ mensagem: "Notícia excluída com sucesso" })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router