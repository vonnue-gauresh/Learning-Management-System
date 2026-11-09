import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate.js';

export function authorizeRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'YOu do not have permission to perform this action',
      });
    }

    next();
  };
}
