import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { pool } from '../config/database.js';

export const getTerraformConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = Number(req.params.id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid request ID.'
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, vm_name, provider, status, terraform_config
       FROM infrastructure_requests
       WHERE id = $1
         AND ($2 = 'ADMIN' OR user_id = $3)`,
      [requestId, req.user!.role, req.user!.id]
    );

    if (result.rowCount === 0) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Infrastructure request not found.'
      });
      return;
    }

    const request = result.rows[0];

    if (!request.terraform_config) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'Terraform configuration is not available. The request may still be awaiting approval or may have been rejected.'
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Failed to retrieve Terraform configuration:', error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve Terraform configuration.'
    });
  }
};
