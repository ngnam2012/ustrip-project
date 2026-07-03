import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import * as auth from '../controllers/authController.js';
import * as trips from '../controllers/tripController.js';
import * as activities from '../controllers/activityController.js';
import * as funds from '../controllers/fundController.js';
import * as expenses from '../controllers/expenseController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as misc from '../controllers/miscController.js';
import * as ai from '../controllers/aiController.js';
import * as chat from '../controllers/chatController.js';
import { authenticate, requireActivityMember, requireContributionMember, requireExpenseMember, requireSplitMember, requireTripMember, requireTripOwner } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|heic)$/.test(file.mimetype)) });
const emailPassword = [body('email').isEmail().withMessage('A valid email is required'), body('password').isLength({ min: 8 }).withMessage('Password must contain at least 8 characters'), validate];
const tripRules = [body('name').trim().isLength({ min: 2 }).withMessage('Trip name is required'), body('destination').trim().notEmpty().withMessage('Destination is required'), body('start_date').isISO8601().withMessage('Start date is invalid'), body('end_date').isISO8601().withMessage('End date is invalid'), validate];

router.post('/auth/register', [...emailPassword.slice(0, 2), body('full_name').trim().isLength({ min: 2 }).withMessage('Full name is required'), validate], auth.register);
router.post('/auth/login', emailPassword, auth.login);
router.get('/auth/me', authenticate, auth.me);
router.patch('/auth/profile', authenticate, auth.updateProfile);

router.use(authenticate);
router.route('/trips').get(trips.listTrips).post(tripRules, trips.createTrip);
router.route('/trips/:tripId').get(requireTripMember, trips.getTrip).patch(requireTripOwner, trips.updateTrip).delete(requireTripOwner, trips.deleteTrip);
router.route('/trips/:tripId/members').get(requireTripMember, trips.listMembers).post(requireTripOwner, body('email').isEmail(), validate, trips.addMember);
router.route('/trips/:tripId/members/:userId').patch(requireTripOwner, trips.updateMember).delete(requireTripOwner, trips.removeMember);

router.route('/trips/:tripId/activities').get(requireTripMember, activities.listActivities).post(requireTripMember, body('title').notEmpty(), body('activity_date').isISO8601(), validate, activities.createActivity);
router.route('/activities/:activityId').get(requireActivityMember, activities.getActivity).patch(requireActivityMember, activities.updateActivity).delete(requireActivityMember, activities.deleteActivity);

router.route('/trips/:tripId/fund').get(requireTripMember, funds.getFund).patch(requireTripOwner, funds.updateFund);
router.route('/trips/:tripId/contributions').get(requireTripMember, funds.listContributions).post(requireTripMember, body('amount').isFloat({ gt: 0 }), validate, funds.addContribution);
router.patch('/contributions/:contributionId', requireContributionMember, funds.updateContribution);

router.route('/trips/:tripId/expenses').get(requireTripMember, expenses.listExpenses).post(requireTripMember, body('title').notEmpty(), body('amount').isFloat({ gt: 0 }), body('payment_source').optional().isIn(['shared_fund', 'personal']), validate, expenses.createExpense);
router.route('/expenses/:expenseId').get(requireExpenseMember, expenses.getExpense).patch(requireExpenseMember, expenses.updateExpense).delete(requireExpenseMember, expenses.deleteExpense);
router.post('/expenses/:expenseId/split', requireExpenseMember, expenses.splitExpense);
router.get('/trips/:tripId/settlements', requireTripMember, expenses.settlements);
router.patch('/splits/:splitId/settled', requireSplitMember, expenses.settleSplit);

router.get('/trips/:tripId/dashboard', requireTripMember, dashboard.dashboard);
router.get('/trips/:tripId/financial-summary', requireTripMember, dashboard.financialSummary);
router.route('/trips/:tripId/reminders').get(requireTripMember, trips.listReminders).post(requireTripMember, trips.createReminder);
router.post('/trips/:tripId/ai/itinerary', requireTripMember, ai.suggestItinerary);
router.post('/trips/:tripId/ai/places', requireTripMember, ai.suggestPlaces);

router.route('/trips/:tripId/messages').get(requireTripMember, chat.getMessages).post(requireTripMember, chat.sendMessage);

router.get('/notifications', misc.notifications);
router.patch('/notifications/:notificationId/read', misc.readNotification);
router.put('/notifications/push-token', body('token').isString().isLength({ min: 20, max: 300 }), body('platform').optional().isIn(['ios', 'android', 'web', 'unknown']), validate, misc.registerPushToken);
router.delete('/notifications/push-token', body('token').isString().isLength({ min: 20, max: 300 }), validate, misc.removePushToken);

for (const kind of ['bill', 'payment-proof', 'avatar', 'trip-cover']) {
  router.post(`/upload/${kind}`, upload.single('image'), misc.uploadImage(kind));
}

export default router;
