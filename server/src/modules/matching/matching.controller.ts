import { Request, Response, NextFunction } from 'express';
import { matchingService } from './matching.service';
import { sendSuccess } from '../../common/response';
import { BadRequestError } from '../../common/errors';

export class MatchingController {
  public getMatchingDonors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { requestId } = req.params;
      if (!requestId) {
        throw new BadRequestError('Request ID is required');
      }

      const result = await matchingService.findMatchingDonors(requestId);
      sendSuccess(res, result, 'Compatible donors matched successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const matchingController = new MatchingController();
