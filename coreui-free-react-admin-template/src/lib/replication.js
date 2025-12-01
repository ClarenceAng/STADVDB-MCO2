import { dbNodes } from '../../server.js'

// replication for transasction that isnt itself
export async function replicateNode(localId) {
  const localDB = dbNodes[localId]
  const conn = await localDB.getConnection()

  try {
    const [pendingLogs] = await conn.query(
      `SELECT * FROM node${localId}_transaction_log WHERE status = "pending" AND origin_node_id != ? ORDER BY version ASC, created_at ASC, log_id ASC`,
      [localId],
    )

    if (!pendingLogs.length) return

    const filteredLogs = pendingLogs.filter((log) => {
      const sameTitleLogs = pendingLogs.filter((log2) => {
        return log.payload.titleID == log2.payload.titleID
      })

      if (sameTitleLogs.length > 1) {
        const max = sameTitleLogs.reduce((prev, next) => {
          if (prev.version == next.version) {
            return prev.origin_node_id < next.origin_node_id ? prev : next
          }
          else {
            return prev.version > next.version ? prev : next
          }
        }, [sameTitleLogs[0]])
        return log.log_id == max.log_id
      } else {
        return true        
      }
    })

    for (const log of filteredLogs) {
      const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload

      try {
        await conn.beginTransaction()
        await conn.query('UPDATE trigger_control SET disable_triggers = 1')

        switch (log.operation_type) {
          case 'INSERT':
            const [r] = await conn.query(
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
            await conn.query(`UPDATE DimTitle SET titleID = ? WHERE titleID = ?`, [
              payload.titleID,
              r.insertId,
            ])
            break
          case 'UPDATE':
            await conn.query(
              `UPDATE DimTitle
               SET tconst = ?, titleType = ?, primaryTitle = ?, originalTitle = ?, isAdult = ?,
                   startYear = ?, endYear = ?, genre1 = ?, genre2 = ?, genre3 = ?,
                   dateCreated = ?, dateModified = ?, version = ?
               WHERE titleID = ? AND version < ?`,
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
                log.version,
                payload.titleID,
                log.version
              ],
            )
            break
            case 'DELETE':
              await conn.query(`DELETE FROM DimTitle WHERE titleID = ?`, [payload.titleID])
            break
          }
          
          await updateCommittedLogsStatus(conn, localId, log.log_id)
          console.log(`Replicated: ${log.version} from node ${log.origin_node_id}`)
        await conn.query('UPDATE trigger_control SET disable_triggers = 0')
        await conn.commit()
      } catch (err) {
        await conn.rollback()
        console.error(`[Node${localId}] Failed to replicate log ${log.log_id}:`, err)
      }
    }
  } finally {
    await conn.query('UPDATE trigger_control SET disable_triggers = 0')
    await conn.commit()
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
export async function commitSelf(localId) {
  const localDB = dbNodes[localId]
  const conn = await localDB.getConnection()

  try {
    await conn.beginTransaction()

    const [pendingLogs] = await conn.query(
      `SELECT * FROM node${localId}_transaction_log 
       WHERE status = "pending" AND origin_node_id = ? 
       ORDER BY created_at ASC, log_id ASC`,
      [localId],
    )

    if (!pendingLogs.length) {
      await conn.commit()
      return
    }

    for (const log of pendingLogs) {
      // simply mark own logs as committed — do NOT apply them
      await conn.query(
        `UPDATE node${localId}_transaction_log 
         SET status = 'committed', committed_at = NOW() 
         WHERE log_id = ?`,
        [log.log_id],
      )
    }

    // update last commit
    await conn.query(
      `UPDATE latest_log_table 
         SET latest_commit = NOW() 
         WHERE node_id = ?`,
      [localId],
    )

    await conn.commit()
  } catch (err) {
    console.error(`[Node${localId}] Failed to commit self logs:`, err)
    await conn.rollback()
  } finally {
    conn.release()
  }
}
