import dotenv from 'dotenv';
import {
  connectRabbitMQ,
  type ProvisioningMessage,
} from '../services/rabbitmq.service.js';
import { triggerGitLabPipeline } from '../integrations/gitlab.integration.js';
import { launchAwxJob } from '../integrations/awx.integration.js';
import { pool } from '../config/database.js';

dotenv.config();

const startProvisioningWorker = async (): Promise<void> => {
  const channel = await connectRabbitMQ();

  await channel.prefetch(1);
  console.log('InfraFlow provisioning worker started.');

  await channel.consume('infraflow.provisioning', async (message) => {
    if (!message) return;

    let job: ProvisioningMessage;

    try {
      job = JSON.parse(message.content.toString()) as ProvisioningMessage;

      if (
        !Number.isInteger(job.jobId) ||
        !Number.isInteger(job.requestId) ||
        !['PROXMOX', 'AWS', 'AZURE', 'GCP'].includes(job.provider)
      ) {
        throw new Error('Invalid provisioning message.');
      }
    } catch (error) {
      console.error('Invalid RabbitMQ message:', error);
      channel.nack(message, false, false);
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE provisioning_jobs
         SET status = 'RUNNING',
             started_at = CURRENT_TIMESTAMP,
             logs = COALESCE(logs, '') ||
                    E'\nProvisioning worker received the job.'
         WHERE id = $1 AND request_id = $2 AND status = 'PENDING'
         RETURNING id`,
        [job.jobId, job.requestId]
      );

      if (result.rowCount === 0) {
        throw new Error('Provisioning job not found or already processed.');
      }

      await pool.query(
        `UPDATE infrastructure_requests
         SET status = 'PROVISIONING',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [job.requestId]
      );

      const logs: string[] = [];
      const externalJobIds: string[] = [];

      try {
        const pipeline = await triggerGitLabPipeline(job.requestId);

        externalJobIds.push(`GitLab:${pipeline.pipelineId}`);
        logs.push(`GitLab pipeline triggered: ${pipeline.pipelineUrl}`);

        try {
          const awxJob = await launchAwxJob(job.requestId);

          externalJobIds.push(`AWX:${awxJob.jobId}`);
          logs.push(`AWX job launched: ${awxJob.jobUrl}`);
        } catch (error) {
          logs.push(
            `AWX integration: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }

        await pool.query(
          `UPDATE provisioning_jobs
           SET status = 'SUBMITTED',
               external_job_id = $1,
               logs = COALESCE(logs, '') || $2,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [
            externalJobIds.join(', ').slice(0, 255),
            '\n' + logs.join('\n'),
            job.jobId,
          ]
        );

        console.log(`Provisioning pipeline submitted for request ${job.requestId}.`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        logs.push(`GitLab integration: ${errorMessage}`);

        const isNotConfigured = errorMessage.includes('not configured');

        await pool.query(
          `UPDATE provisioning_jobs
           SET status = $1,
               logs = COALESCE(logs, '') || $2,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [
            isNotConfigured ? 'BLOCKED' : 'FAILED',
            '\n' + logs.join('\n'),
            job.jobId,
          ]
        );

        await pool.query(
          `UPDATE infrastructure_requests
           SET status = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [isNotConfigured ? 'PENDING_CONFIGURATION' : 'FAILED', job.requestId]
        );

        console.error(`Provisioning failed for request ${job.requestId}:`, error);
      }

      channel.ack(message);
    } catch (error) {
      console.error('Provisioning job processing failed:', error);
      channel.nack(message, false, true);
    }
  });
};

startProvisioningWorker().catch((error) => {
  console.error('Could not start provisioning worker:', error);
  process.exit(1);
});
