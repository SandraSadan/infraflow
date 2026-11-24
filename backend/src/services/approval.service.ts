import { pool } from '../config/database.js';
import { StatusCodes } from 'http-status-codes';
import {
  generateTerraformConfig,
  type TerraformRequest
} from './terraform.service.js';
import { publishProvisioningJob } from './rabbitmq.service.js';

export class ApprovalServiceError extends Error {
  constructor(
    message: string,
    public statusCode: StatusCodes
  ) {
    super(message);
    this.name = 'ApprovalServiceError';
  }
}

export const processApproval = async (
  requestId: number,
  adminId: number,
  decision: 'APPROVED' | 'REJECTED',
  comments?: string
) => {
  const client = await pool.connect();
  let provisioningJobId: number | null = null;
  let provider: TerraformRequest['provider'] | null = null;

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT id, vm_name, provider, os, cpu, ram, disk,
              environment, description, status
       FROM infrastructure_requests
       WHERE id = $1
       FOR UPDATE`,
      [requestId]
    );

    if (requestResult.rowCount === 0) {
      throw new ApprovalServiceError(
        'Infrastructure request not found.',
        StatusCodes.NOT_FOUND
      );
    }

    const request = requestResult.rows[0];

    if (request.status !== 'PENDING_APPROVAL') {
      throw new ApprovalServiceError(
        'This request has already been processed.',
        StatusCodes.CONFLICT
      );
    }

    await client.query(
      `INSERT INTO approvals (
         request_id, admin_id, decision, comments
       )
       VALUES ($1, $2, $3, $4)`,
      [requestId, adminId, decision, comments?.trim() || null]
    );

    let terraformConfig: string | null = null;

    if (decision === 'APPROVED') {
      terraformConfig = generateTerraformConfig(
        request as TerraformRequest
      );

      provider = request.provider as TerraformRequest['provider'];

      const jobResult = await client.query(
        `INSERT INTO provisioning_jobs (
           request_id, integration, status
         )
         VALUES ($1, $2, 'PENDING')
         RETURNING id`,
        [requestId, provider === 'PROXMOX' ? 'PROXMOX' : 'CLOUD']
      );

      provisioningJobId = jobResult.rows[0].id;
    }

    const updatedResult = await client.query(
      `UPDATE infrastructure_requests
       SET status = $1,
           terraform_config = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [decision, terraformConfig, requestId]
    );

    await client.query('COMMIT');

    if (provisioningJobId !== null && provider !== null) {
      try {
        await publishProvisioningJob({
          jobId: provisioningJobId,
          requestId,
          provider
        });
      } catch (error) {
        console.error(
          `Failed to publish provisioning job ${provisioningJobId}:`,
          error
        );
      }
    }

    return updatedResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
