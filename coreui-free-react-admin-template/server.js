import express from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'
import './src/lib/polling.js'

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
export const dbNodes = {
  1: mysql.createPool({
    host: 'stadvdb1.rinaldolee.com',
    user: 'root',
    password: 'cliveisgay',
    database: 'nodedb',
  }),
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

// Create new entry, per node
app.post('/create', async (req, res) => {
  const body = req.body
  const node = req.query['node']
  const insertDraft = {
    titleType: body.titleType,
    primaryTitle: body.primaryTitle,
    originalTitle: body.primaryTitle,
    isAdult: body.isAdult,
    startYear: body.startYear,
    endYear: body.endYear,
    genre1: body.genre1,
    genre2: body.genre2,
    genre3: body.genre3,
  }

  try {
    await dbNodes[node].query('START TRANSACTION')
    const [r] = await dbNodes[node].query(
      `INSERT INTO DimTitle (${Object.keys(insertDraft).join(',')}) VALUES (${Object.keys(
        insertDraft,
      )
        .map(() => '?')
        .join(',')})`,
      Object.values(insertDraft).map((s) => (!!s ? s : null)),
    )
    await dbNodes[node].query('COMMIT')
    res.json({ id: r.insertId })
  } catch (e) {
    console.error(e)
    await dbNodes[node].query('ROLLBACK')
    res.json({ id: null })
  }
})

// Update specific entry, per node
app.post('/update', async (req, res) => {
  const body = req.body
  const node = req.query['node']
  const id = req.query['id']
  const updateDraft = {
    titleType: body.titleType,
    primaryTitle: body.primaryTitle,
    originalTitle: body.primaryTitle,
    isAdult: body.isAdult,
    startYear: body.startYear,
    endYear: body.endYear,
    genre1: body.genre1,
    genre2: body.genre2,
    genre3: body.genre3,
  }

  // Read version first
  const [r] = await dbNodes[node].query(`SELECT titleID, version FROM DimTitle WHERE titleID = ?`, [
    id,
  ])
  const version = r[0].version

  // Make sure updated row has same ver
  try {
    await dbNodes[node].query('START TRANSACTION')
    const [r] = await dbNodes[node].query(
      `UPDATE DimTitle SET ${Object.keys(updateDraft)
        .filter((key) => !!updateDraft[key])
        .map((key) => `${key} = '${updateDraft[key]}'`)
        .join(',')} WHERE titleID = ${id} AND version = ?`,
      [...Object.values(updateDraft).map((s) => (!!s ? s : null)), version],
    )
    await dbNodes[node].query('COMMIT')
    res.json({ id: id })
  } catch (e) {
    console.log(e)
    await dbNodes[node].query('ROLLBACK')
    res.json({ id: null })
  }
})

// Read all
app.get('/items', async (req, res) => {
  // Bruh we getting sql injection here AHAHAHAHAHAHA
  // OFC we ain't doing this in the real world
  console.log(req)
  console.log(req.query)
  const node = req.query['node']
  const pageSize = parseInt(req.query['ps'])
  const pageNumber = parseInt(req.query['page'])
  const keywords = req.query['keywords']?.split(',') || []
  const query = keywords.length
    ? `SELECT * FROM DimTitle WHERE ${keywords.map((k) => `primaryTitle LIKE '%${k}%'`).join(' AND ')} LIMIT ${pageSize} OFFSET ${pageNumber * pageSize}`
    : `SELECT * FROM DimTitle LIMIT ${pageSize} OFFSET ${pageNumber * pageSize}`
  const [rows] = await dbNodes[node].query(query)
  res.json(rows)
})

// Get count
app.get('/count', async (req, res) => {
  // Bruh we getting sql injection here AHAHAHAHAHAHA
  // OFC we ain't doing this in the real world
  const node = req.query['node']
  const keywords = req.query['keywords']?.split(',') || []
  const query = keywords.length
    ? `SELECT COUNT(*) FROM DimTitle WHERE ${keywords.map((k) => `primaryTitle LIKE '%${k}%'`).join(' AND ')}`
    : `SELECT COUNT(*) FROM DimTitle`
  const [count] = await dbNodes[node].query(query)
  res.json({ count: count[0]['COUNT(*)'] })
})

app.listen(4000, () => console.log('Running server on 4000'))
