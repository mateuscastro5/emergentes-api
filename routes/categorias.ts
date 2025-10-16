import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()

const categoriaSchema = z.object({
  nome: z.string().min(2)
})

// GET /categorias - Listar todas as categorias
router.get("/", async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nome: 'asc' }
    })
    res.status(200).json(categorias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /categorias/:id - Buscar categoria por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params
  
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(id) },
      include: { 
        noticias: {
          orderBy: { dataPublicacao: 'desc' }
        }
      }
    })

    if (!categoria) {
      res.status(404).json({ erro: "Categoria não encontrada" })
      return
    }

    res.status(200).json(categoria)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// POST /categorias - Criar nova categoria (admin)
router.post("/", async (req, res) => {
  const validacao = categoriaSchema.safeParse(req.body)
  if (!validacao.success) {
    res.status(400).json({ erro: validacao.error })
    return
  }

  try {
    const categoria = await prisma.categoria.create({
      data: validacao.data
    })
    res.status(201).json(categoria)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// PUT /categorias/:id - Atualizar categoria (admin)
router.put("/:id", async (req, res) => {
  const { id } = req.params
  const validacao = categoriaSchema.safeParse(req.body)
  
  if (!validacao.success) {
    res.status(400).json({ erro: validacao.error })
    return
  }

  try {
    const categoria = await prisma.categoria.update({
      where: { id: Number(id) },
      data: validacao.data
    })
    res.status(200).json(categoria)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// DELETE /categorias/:id - Deletar categoria (admin)
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  
  try {
    await prisma.categoria.delete({
      where: { id: Number(id) }
    })
    res.status(200).json({ mensagem: "Categoria removida com sucesso" })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router