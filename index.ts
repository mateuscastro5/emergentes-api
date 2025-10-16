import express from 'express'
import cors from 'cors'

import routesLogin from './routes/login'
import routesClientes from './routes/clientes'
import routesNoticias from './routes/noticias'
import routesCategorias from './routes/categorias'
import routesInteracoes from './routes/interacoes'
import routesDashboard from './routes/dashboard'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/clientes/login", routesLogin)
app.use("/clientes", routesClientes)
app.use("/noticias", routesNoticias)
app.use("/categorias", routesCategorias)
app.use("/interacoes", routesInteracoes)
app.use("/dashboard", routesDashboard)

app.get('/', (req, res) => {
  res.send('API: Sistema de Notícias')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})