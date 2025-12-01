import { dbNodes } from '../../server.js'
import { replicateNode } from './replication.js'

async function applyLogsBatch(localDB, localId, sourceNodeId, logs, localTable) {
  if (logs.length === 0) return

  console.log(
    `[Node ${localId}] Applying ${logs.length} logs from Node ${sourceNodeId} into ${localTable}`,
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
          `INSERT INTO ${localTable} (operation_type, payload, version, status, origin_node_id, created_at, committed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            operation_type,
            JSON.stringify(parsedPayload),
            version,
            'pending',
            sourceNodeId,
            created_at,
            committed_at,
          ],
        )

        console.log(`[Node ${localId}] Inserted log ${log_id} from Node ${sourceNodeId}`)

        if (new Date(created_at) > maxTimestamp) maxTimestamp = new Date(created_at)
      }

      // Advance latest_log after all inserts
      await conn.query(`UPDATE latest_log_table SET latest_log = ? WHERE node_id = ?`, [
        maxTimestamp,
        sourceNodeId,
      ])
      console.log(`[Node ${localId}] Updated latest_log for Node${sourceNodeId} to ${maxTimestamp}`)

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      console.error(`[Node ${localId}] Failed applying logs from Node${sourceNodeId}:`, err)
      throw err
    }
  } finally {
    conn.release()
  }
}

async function pollNode(localId, remoteId, filterFunc = null) {
  const localDB = dbNodes[localId]
  const remoteDB = dbNodes[remoteId]

  // set READ COMMITTED for each polling
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
       WHERE created_at > ? AND origin_node_id != ?
       ORDER BY created_at ASC, log_id ASC`,
      [lastApplied, localId],
    )
    console.log(`[Node${localId}] Fetched ${logs.length} new logs from Node${remoteId}`)

    if (logs.length === 0) return

    // Filter logs if need be
    const filteredLogs = filterFunc ? logs.filter(filterFunc) : logs
    if (filteredLogs.length !== logs.length) {
      console.log(`[Node${localId}] ${logs.length - filteredLogs.length} logs were filtered out`)
    }

    // Apply logs
    await applyLogsBatch(localDB, localId, remoteId, filteredLogs, `node${localId}_transaction_log`)
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

async function syncNode1() {
  await pollNode1()
  await replicateNode(1)
}

async function syncNode2() {
  await pollNode2()
  await replicateNode(2)
}

async function syncNode3() {
  await pollNode3()
  await replicateNode(3)
}

async function startNode1Polling() {
  while (true) {
    try {
      await syncNode1()
    } catch (err) {
      console.error(`[Node1] Polling error:`, err)
    }
    // Wait 1 second before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

async function startNode2Polling() {
  while (true) {
    try {
      await syncNode2()
    } catch (err) {
      console.error(`[Node2] Polling error:`, err)
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

async function startNode3Polling() {
  while (true) {
    try {
      await syncNode3()
    } catch (err) {
      console.error(`[Node3] Polling error:`, err)
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

// Start all polling loops
startNode1Polling()
setTimeout(() => startNode2Polling(), 100) // stagger slightly
setTimeout(() => startNode3Polling(), 200)
