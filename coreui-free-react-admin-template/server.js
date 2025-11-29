import express from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'

// The server
const app = express()
app.use(express.json())
app.use(
  cors({
    origin: '*',
  }),
)

// No need for env LOL
// In the real world, we definitely won't do this tho
const dbNodes = {
  2: mysql.createPool({
    host: 'stadvdb2.rinaldolee.com',
    user: 'root',
    password: 'cliveisgay',
    database: 'nodedb',
  }),
  3: mysql.createPool({
    host: 'stadvdb3.rinaldolee.com',
    user: 'root',
    password: 'cliveisgay',
    database: 'nodedb',
  }),
}

// // CREATE
// app.post('/items', async (req, res) => {
//   const { name } = req.body
//   const [r] = await db.query('INSERT INTO items (name) VALUES (?)', [name])
//   res.json({ id: r.insertId })
// })

app.get('/')

// READ ALL
app.get('/items', async (req, res) => {
  // Bruh we getting sql injection here AHAHAHAHAHAHA
  // OFC we ain't doing this in the real world
  const node = req.query['node']
  const pageSize = req.query['ps']
  const pageNumber = req.query['page']
  const query = `SELECT * FROM DimTitle LIMIT ${pageSize} OFFSET ${pageNumber * pageSize}`
  const [rows] = await dbNodes[node].query(query)
  res.json(rows)
})

// // READ ONE
// app.get('/items/:id', async (req, res) => {
//   const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id])
//   res.json(rows[0] || null)
// })

// // UPDATE
// app.put('/items/:id', async (req, res) => {
//   const { name } = req.body
//   await db.query('UPDATE items SET name = ? WHERE id = ?', [name, req.params.id])
//   res.json({ ok: true })
// })

// // DELETE
// app.delete('/items/:id', async (req, res) => {
//   await db.query('DELETE FROM items WHERE id = ?', [req.params.id])
//   res.json({ ok: true })
// })

app.listen(4000, () => console.log('Running server on 4000'))
