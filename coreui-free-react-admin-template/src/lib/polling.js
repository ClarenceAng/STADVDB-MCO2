import { dbNodes } from '../../server.js'

async function applyLogsBatch(localDB, sourceNodeId, logs, localTable) {
  if (logs.length === 0) return

  console.log(
    `[Node${localDB.nodeId}] Applying ${logs.length} logs from Node${sourceNodeId} into ${localTable}`,
  )

  const conn = await localDB.getConnection()
  try {
    await conn.beginTransaction()
    try {
      let maxTimestamp = new Date(logs[0].created_at)

      for (const log of logs) {
        const { operation_type, payload, version, created_at, committed_at, log_id } = log
        const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload

        await conn.query(
          `INSERT INTO ${localTable} (operation_type, payload, version, status, created_at, committed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            operation_type,
            JSON.stringify(parsedPayload),
            version,
            'pending',
            created_at,
            committed_at,
          ],
        )

        console.log(`[Node${localDB.nodeId}] Inserted log ${log_id} from Node${sourceNodeId}`)

        if (new Date(created_at) > maxTimestamp) maxTimestamp = new Date(created_at)
      }

      // Advance latest_log after all inserts
      await conn.query(`UPDATE latest_log_table SET latest_log = ? WHERE node_id = ?`, [
        maxTimestamp,
        sourceNodeId,
      ])
      console.log(
        `[Node${localDB.nodeId}] Updated latest_log for Node${sourceNodeId} to ${maxTimestamp}`,
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      console.error(`[Node${localDB.nodeId}] Failed applying logs from Node${sourceNodeId}:`, err)
      throw err
    }
  } finally {
    conn.release()
  }
}

async function pollNode(localId, remoteId, filterFunc = null) {
  const localDB = dbNodes[localId]
  const remoteDB = dbNodes[remoteId]

  // set READ COMMITTED for each polling session
  const conn = await remoteDB.getConnection()
  try {
    await conn.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED')

    // Get the last applied timestamp
    const [[{ latest_log: lastApplied }]] = await localDB.query(
      `SELECT latest_log FROM latest_log_table WHERE node_id = ?`,
      [remoteId],
    )
    console.log(`[Node${localId}] Last applied timestamp from Node${remoteId}: ${lastApplied}`)

    // Fetch new logs
    const [logs] = await conn.query(
      `SELECT * FROM node${remoteId}_transaction_log 
       WHERE created_at > ? 
       ORDER BY created_at ASC, log_id ASC`,
      [lastApplied],
    )
    console.log(`[Node${localId}] Fetched ${logs.length} new logs from Node${remoteId}`)

    if (logs.length === 0) return

    // Filter logs if need be
    const filteredLogs = filterFunc ? logs.filter(filterFunc) : logs
    if (filteredLogs.length !== logs.length) {
      console.log(`[Node${localId}] ${logs.length - filteredLogs.length} logs were filtered out`)
    }

    // Apply logs
    await applyLogsBatch(localDB, remoteId, filteredLogs, `node${localId}_transaction_log`)
  } finally {
    conn.release()
  }
}

/**
 * Filters
 */
const filterMisc = (log) => {
  try {
    const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload
    if (log.operation_type === 'UPDATE') return true
    return payload.titleType && !payload.titleType.toLowerCase().startsWith('tv')
  } catch {
    return false
  }
}

const filterTV = (log) => {
  try {
    const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload
    if (log.operation_type === 'UPDATE') return true
    return payload.titleType && payload.titleType.toLowerCase().startsWith('tv')
  } catch {
    return false
  }
}

async function pollNode1() {
  await pollNode(1, 2)
  await pollNode(1, 3)
}

async function pollNode2() {
  await pollNode(2, 1, filterMisc)
}

async function pollNode3() {
  await pollNode(3, 1, filterTV)
}

/**
 * poll at certain intervals to prevent deadlocks
 */
setInterval(() => pollNode1(), 1000)
setTimeout(() => setInterval(() => pollNode2(), 1000), 100)
setTimeout(() => setInterval(() => pollNode3(), 1000), 200)
