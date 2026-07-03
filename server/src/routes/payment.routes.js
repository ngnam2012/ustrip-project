import { Router } from 'express';
import { body } from 'express-validator';
import * as payments from '../controllers/payment.controller.js';
import { authenticate, requireTripMember } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/trips/:tripId/contributions/momo/create', authenticate, requireTripMember, body('amount').isFloat({ min: 1000, max: 50000000 }), body('return_url').optional().isString(), validate, payments.create);
router.post('/payments/momo/ipn', payments.ipn);
router.get('/payments/momo/return', payments.returnResult);
router.get('/payments/:paymentId/status', authenticate, payments.status);
router.post('/payments/momo/query', authenticate, body('payment_id').isUUID(), validate, payments.query);
router.get('/payments/:paymentId/mock', payments.mockPage);
router.post('/payments/:paymentId/mock-success', payments.mockSuccess);
router.get('/payments/:paymentId/mock-success', payments.mockSuccess);

export default router;
