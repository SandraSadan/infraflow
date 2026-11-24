import { pool } from '../config/database.js';
import { StatusCodes } from 'http-status-codes';

export type InfrastructureProvider =
  | 'PROXMOX'
  | 'AWS'
  | 'AZURE'
  | 'GCP';

export type InfrastructureEnvironment =
  | 'DEV'
  | 'STAGE'
  | 'PROD';

export interface CreateRequestInput {
  vm_name: string;
  provider: InfrastructureProvider;
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  environment: InfrastructureEnvironment;
  description?: string;
}

export class RequestServiceError extends Error {
  constructor(
    message: string,
    public statusCode: StatusCodes
  ) {
    super(message);
    this.name = 'RequestServiceError';
  }
}

const validProviders = ['PROXMOX', 'AWS', 'AZURE', 'GCP'];
const validEnvironments = ['DEV', 'STAGE', 'PROD'];

const validateRequest = (input: CreateRequestInput): void => {
  if (
    !input.vm_name?.trim() ||
    input.vm_name.trim().length > 100
  ) {
    throw new RequestServiceError(
      'VM name is required and must not exceed 100 characters.',
      StatusCodes.BAD_REQUEST
    );
  }

  if (!validProviders.includes(input.provider)) {
    throw new RequestServiceError('Invalid infrastructure provider.', StatusCodes.BAD_REQUEST);
  }

  if (!input.os?.trim() || input.os.trim().length > 100) {
    throw new RequestServiceError('A valid operating system is required.', StatusCodes.BAD_REQUEST);
  }

  if (
    !Number.isInteger(input.cpu) ||
    !Number.isInteger(input.ram) ||
    !Number.isInteger(input.disk) ||
    input.cpu <= 0 ||
    input.ram <= 0 ||
    input.disk <= 0
  ) {
    throw new RequestServiceError(
      'CPU, RAM and disk must be positive integers.',
      StatusCodes.BAD_REQUEST
    );
  }

  if (!validEnvironments.includes(input.environment)) {
    throw new RequestServiceError('Invalid environment.', StatusCodes.BAD_REQUEST);
  }

  if (
    input.description !== undefined &&
    (typeof input.description !== 'string' ||
      input.description.length > 2000)
  ) {
    throw new RequestServiceError(
      'Description must not exceed 2000 characters.',
      StatusCodes.BAD_REQUEST
    );
  }
};

export const createInfrastructureRequest = async (
  userId: number,
  input: CreateRequestInput
) => {
  validateRequest(input);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock this user's quota row to prevent concurrent quota overruns.
    const quotaResult = await client.query(
      `SELECT max_cpu, max_ram, max_disk
       FROM user_quotas
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (quotaResult.rowCount === 0) {
      throw new RequestServiceError(
        'No resource quota has been configured for this user.',
        StatusCodes.FORBIDDEN
      );
    }

    const quota = quotaResult.rows[0];

    // Count resources in all requests except rejected or failed ones.
    const usageResult = await client.query(
      `SELECT
         COALESCE(SUM(cpu), 0) AS used_cpu,
         COALESCE(SUM(ram), 0) AS used_ram,
         COALESCE(SUM(disk), 0) AS used_disk
       FROM infrastructure_requests
       WHERE user_id = $1
         AND status NOT IN ('REJECTED', 'FAILED')`,
      [userId]
    );

    const usage = usageResult.rows[0];

    const usedCpu = Number(usage.used_cpu);
    const usedRam = Number(usage.used_ram);
    const usedDisk = Number(usage.used_disk);

    if (usedCpu + input.cpu > quota.max_cpu) {
      throw new RequestServiceError(
        `CPU quota exceeded. Available: ${quota.max_cpu - usedCpu}.`,
        StatusCodes.FORBIDDEN
      );
    }

    if (usedRam + input.ram > quota.max_ram) {
      throw new RequestServiceError(
        `RAM quota exceeded. Available: ${quota.max_ram - usedRam}.`,
        StatusCodes.FORBIDDEN
      );
    }

    if (usedDisk + input.disk > quota.max_disk) {
      throw new RequestServiceError(
        `Disk quota exceeded. Available: ${quota.max_disk - usedDisk}.`,
        StatusCodes.FORBIDDEN
      );
    }

    const result = await client.query(
      `INSERT INTO infrastructure_requests (
         user_id,
         vm_name,
         provider,
         os,
         cpu,
         ram,
         disk,
         environment,
         description,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_APPROVAL')
       RETURNING *`,
      [
        userId,
        input.vm_name.trim(),
        input.provider,
        input.os.trim(),
        input.cpu,
        input.ram,
        input.disk,
        input.environment,
        input.description?.trim() || null
      ]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getInfrastructureRequests = async (
  userId: number,
  isAdmin: boolean
) => {
  const query = isAdmin
    ? `SELECT r.*, u.name AS requester_name, u.email AS requester_email
       FROM infrastructure_requests r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    : `SELECT *
       FROM infrastructure_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`;

  const result = await pool.query(
    query,
    isAdmin ? [] : [userId]
  );

  return result.rows;
};

export const getInfrastructureRequestById = async (
  requestId: number,
  userId: number,
  isAdmin: boolean
) => {
  const result = await pool.query(
    `SELECT r.*, u.name AS requester_name, u.email AS requester_email
     FROM infrastructure_requests r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = $1
       AND ($2::boolean = TRUE OR r.user_id = $3)`,
    [requestId, isAdmin, userId]
  );

  return result.rows[0] ?? null;
};
