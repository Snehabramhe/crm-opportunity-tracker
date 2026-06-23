import { Router } from 'express';
import {
  list,
  stats,
  getOne,
  create,
  update,
  remove,
  addActivity,
} from '../controllers/opportunityController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  activitySchema,
} from '../validators/opportunityValidators.js';

const router = Router();

// All opportunity routes require authentication.
router.use(protect);

router.route('/').get(list).post(validate(createOpportunitySchema), create);

// Must be declared before '/:id' so it isn't captured as an opportunity id.
router.get('/stats', stats);

router
  .route('/:id')
  .get(getOne)
  .put(validate(updateOpportunitySchema), update)
  .delete(remove);

router.post('/:id/activity', validate(activitySchema), addActivity);

export default router;
