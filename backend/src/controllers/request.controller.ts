import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  createInfrastructureRequest,
  getInfrastructureRequests,
  getInfrastructureRequestById,
  RequestServiceError
} from '../services/request.service.js';

export const createRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const request = await createInfrastructureRequest(
      req.user!.id,
      req.body
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Infrastructure request submitted successfully.',
      data: request
    });
  } catch (error) {
    if (error instanceof RequestServiceError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Create request error:', error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Unable to create infrastructure request.'
    });
  }
};

export const getRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';

    const requests = await getInfrastructureRequests(
      req.user!.id,
      isAdmin
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get requests error:', error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Unable to retrieve infrastructure requests.'
    });
  }
};

export const getRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestId = Number(req.params.id);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Invalid request ID.'
    });
    return;
  }

  try {
    const isAdmin = req.user!.role === 'ADMIN';

    const request = await getInfrastructureRequestById(
      requestId,
      req.user!.id,
      isAdmin
    );

    if (!request) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Infrastructure request not found.'
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get request details error:', error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Unable to retrieve request details.'
    });
  }
};
