import { db } from '~~/server/database/db'
import { jobQueues } from '~~/server/database/schema'
import { createJobFromAPIJob } from '~~/server/utils/ingestion'
import type { JobFromAPIs } from '~~/server/types/JobFromAPIs'
import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // 1. Fetch oldest item from queue
  const queueItem = await db.query.jobQueues.findFirst({
    orderBy: [asc(jobQueues.createdAt)],
  })

  if (!queueItem) {
    return { message: 'No jobs in queue' }
  }

  // Cast JSONB to strict type
  const jobDetails = queueItem.jobDetails as unknown as JobFromAPIs

  try {
    console.log(`Processing queue item: ${jobDetails.title} (${jobDetails.link})`)

    // 2. Create Job using ingestion service
    const newJob = await createJobFromAPIJob(jobDetails)

    // 3. Delete from queue upon success
    await db.delete(jobQueues).where(eq(jobQueues.id, queueItem.id))

    return {
      message: 'Job processed successfully',
      jobId: newJob?.id,
      title: newJob?.title,
    }
  }
  catch (error) {
    console.error('Error processing queue item:', error)

    // Optional: Increment retry count or move to dead-letter queue if implemented
    // For now, we throw 500 so the caller knows it failed

    throw createError({
      statusCode: 500,
      statusMessage: `Error processing queue item: ${queueItem.id}`,
      cause: error,
    })
  }
})
