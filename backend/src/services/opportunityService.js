import Opportunity from '../models/Opportunity.js';
import { STAGES, PRIORITIES } from '../models/Opportunity.js';
import ApiError from '../utils/ApiError.js';

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  value_desc: { estimatedValue: -1 },
  value_asc: { estimatedValue: 1 },
  followup: { nextFollowUpDate: 1 },
};

/**
 * List opportunities in the shared pipeline with optional filtering,
 * search, sorting, and pagination.
 */
export async function listOpportunities(query = {}, currentUserId) {
  const { stage, priority, search, sort = 'newest', mine } = query;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

  const filter = {};
  if (stage && STAGES.includes(stage)) filter.stage = stage;
  if (priority && PRIORITIES.includes(priority)) filter.priority = priority;
  // "My opportunities" — owner is taken from the JWT, never from the client.
  if ((mine === 'true' || mine === true) && currentUserId) filter.owner = currentUserId;
  if (search && search.trim()) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ customerName: rx }, { requirement: rx }, { contactName: rx }];
  }

  const sortSpec = SORT_MAP[sort] || SORT_MAP.newest;

  const [items, total] = await Promise.all([
    Opportunity.find(filter)
      .populate('owner', 'name email')
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit),
    Opportunity.countDocuments(filter),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) || 1, limit };
}

const OPEN_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent'];

/**
 * Aggregate pipeline statistics across the ENTIRE shared pipeline
 * (independent of filters/pagination) for the dashboard summary cards.
 */
export async function getStats() {
  const [agg] = await Opportunity.aggregate([
    {
      $group: {
        _id: null,
        openPipelineValue: {
          $sum: {
            $cond: [{ $in: ['$stage', OPEN_STAGES] }, { $ifNull: ['$estimatedValue', 0] }, 0],
          },
        },
        wonValue: {
          $sum: {
            $cond: [{ $eq: ['$stage', 'Won'] }, { $ifNull: ['$estimatedValue', 0] }, 0],
          },
        },
        highPriorityCount: {
          $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] },
        },
        total: { $sum: 1 },
      },
    },
  ]);

  return {
    openPipelineValue: agg?.openPipelineValue || 0,
    wonValue: agg?.wonValue || 0,
    highPriorityCount: agg?.highPriorityCount || 0,
    total: agg?.total || 0,
  };
}

export async function getOpportunity(id) {
  const opp = await Opportunity.findById(id).populate('owner', 'name email');
  if (!opp) throw ApiError.notFound('Opportunity not found');
  return opp;
}

/** Create — owner is forced to the authenticated user id. */
export async function createOpportunity(data, ownerId) {
  const opp = await Opportunity.create({ ...data, owner: ownerId });
  return opp.populate('owner', 'name email');
}

/**
 * Load an opportunity and assert the given user owns it.
 * 404 if missing, 403 if owned by someone else.
 */
async function loadOwned(id, userId) {
  const opp = await Opportunity.findById(id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  if (String(opp.owner) !== String(userId)) {
    throw ApiError.forbidden('You can only modify opportunities you created');
  }
  return opp;
}

export async function updateOpportunity(id, data, userId) {
  const opp = await loadOwned(id, userId);
  // `owner` is never in `data` (stripped by validator); assign the rest.
  Object.assign(opp, data);
  await opp.save();
  return opp.populate('owner', 'name email');
}

export async function deleteOpportunity(id, userId) {
  const opp = await loadOwned(id, userId);
  await opp.deleteOne();
  return opp;
}

export async function addActivity(id, text, userId) {
  const opp = await loadOwned(id, userId);
  opp.activity.push({ text });
  await opp.save();
  return opp.populate('owner', 'name email');
}
