import fastify from 'fastify'
import cors from '@fastify/cors'

const app = fastify()
app.register(cors, { origin: '*' })

app.post('/log', async (req, res) => {
    console.log("=== CLIENT TELEMETRY ===");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("========================");
    res.send({ ok: true })
})

app.listen({ port: 5859, host: '0.0.0.0' }, () => console.log('Telemetry server running on 5859'))
