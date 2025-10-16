import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  const mensaPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { email }
    })

    if (!cliente) {
      res.status(400).json({ erro: mensaPadrao })
      return
    }

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, cliente.senha)
    
    if (!senhaCorreta) {
      res.status(400).json({ erro: mensaPadrao })
      return
    }

    // Verificar se JWT_KEY existe
    const jwtKey = process.env.JWT_KEY
    if (!jwtKey) {
      console.error("JWT_KEY não configurada!")
      res.status(500).json({ erro: "Erro de configuração do servidor" })
      return
    }

    // Gerar token
    const token = jwt.sign({
      clienteLogadoId: cliente.id,
      clienteLogadoNome: cliente.nome
    }, jwtKey, { expiresIn: "1h" })

    res.status(200).json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      admin: cliente.admin,
      token
    })

  } catch (error) {
    console.error("Erro no login:", error)
    res.status(500).json({ erro: "Erro interno do servidor" })
  }
})

export default router