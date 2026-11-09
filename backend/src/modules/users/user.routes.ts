import { Router } from 'express';
import { createUser, listUsers, getUser, updateUserDetails, changeUserStatus } from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';

const router = Router();

router.post('/', authenticate, authorizeRole('ADMIN'), createUser);
router.get('/', authenticate, authorizeRole('ADMIN'), listUsers);
router.get('/:id', authenticate, authorizeRole('ADMIN'), getUser)
router.patch('/:id', authenticate, authorizeRole('ADMIN'), updateUserDetails)
router.patch('/:id/status', authenticate, authorizeRole('ADMIN'), changeUserStatus)

export default router;
