import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/opportunityService.js';

// GET /api/opportunities
export const list = asyncHandler(async (req, res) => {
  // Pass the authenticated user id so the `mine=true` filter resolves from the JWT.
  const result = await service.listOpportunities(req.query, req.user.id);
  res.status(200).json({ success: true, ...result });
});

// GET /api/opportunities/stats  (global summary across the whole pipeline)
export const stats = asyncHandler(async (req, res) => {
  const data = await service.getStats();
  res.status(200).json({ success: true, stats: data });
});

// GET /api/opportunities/:id
export const getOne = asyncHandler(async (req, res) => {
  const opportunity = await service.getOpportunity(req.params.id);
  res.status(200).json({ success: true, opportunity });
});

// POST /api/opportunities
export const create = asyncHandler(async (req, res) => {
  // owner derived from JWT (req.user.id) — never from the body.
  const opportunity = await service.createOpportunity(req.body, req.user.id);
  res.status(201).json({ success: true, opportunity });
});

// PUT /api/opportunities/:id  (owner only)
export const update = asyncHandler(async (req, res) => {
  const opportunity = await service.updateOpportunity(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, opportunity });
});

// DELETE /api/opportunities/:id  (owner only)
export const remove = asyncHandler(async (req, res) => {
  await service.deleteOpportunity(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Opportunity deleted' });
});

// POST /api/opportunities/:id/activity  (owner only)
export const addActivity = asyncHandler(async (req, res) => {
  const opportunity = await service.addActivity(req.params.id, req.body.text, req.user.id);
  res.status(201).json({ success: true, opportunity });
});
