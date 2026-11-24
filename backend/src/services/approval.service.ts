import { pool } from '../config/database.js';
import { StatusCodes } from 'http-status-codes';

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

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT id, status
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
         request_id,
         admin_id,
         decision,
         comments
       )
       VALUES ($1, $2, $3, $4)`,
      [requestId, adminId, decision, comments?.trim() || null]
    );

    const updatedResult = await client.query(
      `UPDATE infrastructure_requests
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [decision, requestId]
    );

    await client.query('COMMIT');

    return updatedResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
