import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from "zod"

const prisma = new PrismaClient()
const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().min(10),
  cidade: z.string().min(2)
})

// POST /clientes - Cadastro de cliente
router.post("/", async (req, res) => {
  const validacao = clienteSchema.safeParse(req.body)
  if (!validacao.success) {
    res.status(400).json({ erro: validacao.error })
    return
  }

  const { nome, email, senha, telefone, cidade } = validacao.data

  try {
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email }
    })

    if (clienteExistente) {
      res.status(400).json({ erro: "E-mail já cadastrado" })
      return
    }

    const salt = await bcrypt.genSalt(12)
    const senhaHash = await bcrypt.hash(senha, salt)

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone,
        cidade
      }
    })

    res.status(201).json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email
    })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /clientes/:id - Buscar cliente por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params
  
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cidade: true,
        admin: true
      }
    })

    if (cliente) {
      res.status(200).json(cliente)
    } else {
      res.status(404).json({ erro: "Cliente não encontrado" })
    }
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// GET /clientes - Listar todos os clientes (para admin)
router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cidade: true
      },
      orderBy: { nome: 'asc' }
    })
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router