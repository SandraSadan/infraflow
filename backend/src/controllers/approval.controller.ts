import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  processApproval,
  ApprovalServiceError
} from '../services/approval.service.js';

const handleApproval = async (
  req: Request,
  res: Response,
  decision: 'APPROVED' | 'REJECTED'
): Promise<void> => {
  const requestId = Number(req.params.id);
  const { comments } = req.body;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Invalid request ID.'
    });
    return;
  }

  if (
    comments !== undefined &&
    (typeof comments !== 'string' || comments.length > 2000)
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Comments must be a string of at most 2000 characters.'
    });
    return;
  }

  try {
    const request = await processApproval(
      requestId,
      req.user!.id,
      decision,
      comments
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Infrastructure request ${decision.toLowerCase()} successfully.`,
      data: request
    });
  } catch (error) {
    if (error instanceof ApprovalServiceError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Approval processing error:', error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Unable to process infrastructure request.'
    });
  }
};

export const approveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  await handleApproval(req, res, 'APPROVED');
};

export const rejectRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  await handleApproval(req, res, 'REJECTED');
};
