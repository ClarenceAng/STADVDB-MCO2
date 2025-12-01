import { dbNodes } from '../../server.js'
import { replicateNode, commitSelf } from './replication.js'

async function applyLogsBatch(localDB, localId, sourceNodeId, logs, localTable) {
  if (!logs.length) return

  const conn = await localDB.getConnection()
  try {
    await conn.beginTransaction()
    let maxTimestamp = new Date(logs[0].created_at)

    for (const log of logs) {
      const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload
      if (log.status !== 'pending') continue

      await conn.query(
        `INSERT INTO ${localTable} (operation_type, payload, version, status, origin_node_id, created_at, committed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          log.operation_type,
          JSON.stringify(payload),
          log.version,
          'pending',
          sourceNodeId,
          log.created_at,
          log.committed_at,
        ],
      )

      console.log(`Added log ${log.version} from node ${sourceNodeId}`)

      const logCreated = new Date(log.created_at)
      if (logCreated > maxTimestamp) maxTimestamp = logCreated
    }

    await conn.query(`UPDATE latest_log_table SET latest_log = ? WHERE node_id = ?`, [
      maxTimestamp,
      sourceNodeId,
    ])

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    console.error(`[Node${localId}] Failed to apply logs from Node${sourceNodeId}:`, err)
  } finally {
    conn.release()
  }
}

export async function pollNode(localId, remoteId, filterFunc = null) {
  const localDB = dbNodes[localId]
  const remoteDB = dbNodes[remoteId]

  let conn
  try {
    conn = await remoteDB.getConnection()
    await conn.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED')
  } catch (err) {
    console.error(`[Node${localId}] Cannot connect to Node${remoteId}:`, err.message)
    return // skip this cycle if remote node is down
  }

  try {
    const [[{ latest_log: lastApplied }]] = await localDB.query(
      `SELECT latest_log FROM latest_log_table WHERE node_id = ?`,
      [remoteId],
    )

    const [logs] = await conn.query(
      `SELECT * FROM node${remoteId}_transaction_log
       WHERE created_at > ? AND origin_node_id != ?
       ORDER BY created_at ASC, log_id ASC`,
      [lastApplied, localId],
    )

    if (!logs.length) return

    const filteredLogs = filterFunc ? logs.filter(filterFunc) : logs
    if (filteredLogs.length !== logs.length) {
      console.log(`[Node${localId}] ${logs.length - filteredLogs.length} logs filtered out`)
    }

    console.log(filteredLogs)

    await applyLogsBatch(localDB, localId, remoteId, filteredLogs, `node${localId}_transaction_log`)
  } catch (err) {
    console.error(`[Node${localId}] Error polling Node${remoteId}:`, err)
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
    if (log.operation_type === 'UPDATE' || log.operation_type === 'DELETE') return true
    return payload.titleType && !payload.titleType.toLowerCase().startsWith('tv')
  } catch {
    return false
  }
}

const filterTV = (log) => {
  try {
    const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload
    if (log.operation_type === 'UPDATE' || log.operation_type === 'DELETE') return true
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
  try {
    await pollNode1()
    await replicateNode(1)
    await commitSelf(1)
  } catch (err) {
    console.error('[Node1] sync failed:', err)
  }
}

async function syncNode2() {
  try {
    await pollNode2()
    await replicateNode(2)
    await commitSelf(2)
  } catch (err) {
    console.error('[Node2] sync failed:', err)
  }
}

async function syncNode3() {
  try {
    await pollNode3()
    await replicateNode(3)
    await commitSelf(3)
  } catch (err) {
    console.error('[Node3] sync failed:', err)
  }
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
