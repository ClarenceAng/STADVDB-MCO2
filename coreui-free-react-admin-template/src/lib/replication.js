import { dbNodes } from '../../server.js'

export async function replicateNode(localId) {
  const localDB = dbNodes[localId]
  const conn = await localDB.getConnection()

  try {
    // Fetch pending logs
    const [pendingLogs] = await conn.query(
      `SELECT * FROM node${localId}_transaction_log WHERE status = "pending" ORDER BY created_at ASC, log_id ASC`,
    )

    if (pendingLogs.length === 0) return

    for (const log of pendingLogs) {
      console.log(`[Node${localId}] Replicating log ID ${log.log_id} to other nodes`)

      const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload

      try {
        await conn.beginTransaction()

        // Disable triggers
        await conn.query('UPDATE trigger_control SET disable_triggers = 1')

        // Perform the operation
        switch (log.operation_type) {
          case 'INSERT':
            await conn.query(
              `INSERT INTO DimTitle (
                tconst, titleType, primaryTitle, originalTitle, isAdult,
                startYear, endYear, genre1, genre2, genre3, dateCreated, dateModified
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                payload.tconst,
                payload.titleType,
                payload.primaryTitle,
                payload.originalTitle,
                payload.isAdult,
                payload.startYear,
                payload.endYear,
                payload.genre1,
                payload.genre2,
                payload.genre3,
                payload.dateCreated,
                payload.dateModified,
              ],
            )
            break

          case 'UPDATE':
            await conn.query(
              `UPDATE DimTitle
               SET tconst = ?, titleType = ?, primaryTitle = ?, originalTitle = ?, isAdult = ?,
                   startYear = ?, endYear = ?, genre1 = ?, genre2 = ?, genre3 = ?,
                   dateCreated = ?, dateModified = ?
               WHERE titleID = ?`,
              [
                payload.tconst,
                payload.titleType,
                payload.primaryTitle,
                payload.originalTitle,
                payload.isAdult,
                payload.startYear,
                payload.endYear,
                payload.genre1,
                payload.genre2,
                payload.genre3,
                payload.dateCreated,
                payload.dateModified,
                payload.titleID,
              ],
            )
            break

          case 'DELETE':
            await conn.query(`DELETE FROM DimTitle WHERE titleID = ?`, [payload.titleID])
            break
        }

        // Update transaction log and latest_log
        await updateCommittedLogsStatus(conn, localId, log.log_id)

        // Re-enable triggers
        await conn.query('UPDATE trigger_control SET disable_triggers = 0')

        await conn.commit()
      } catch (err) {
        await conn.rollback()
        console.error(`[Node${localId}] Failed to replicate log ${log.log_id}:`, err)
      }
    }
  } finally {
    conn.release()
  }
}

async function updateCommittedLogsStatus(conn, localId, logId) {
  await conn.query(
    `UPDATE node${localId}_transaction_log
     SET status = 'committed', committed_at = NOW()
     WHERE log_id = ?`,
    [logId],
  )

  await conn.query(
    `UPDATE latest_log_table
     SET latest_commit = NOW()
     WHERE node_id = ?`,
    [localId],
  )
}
