import api from './api.js';

export const listOpportunities = (params = {}) =>
  api.get('/opportunities', { params }).then((r) => r.data);

export const getStats = () =>
  api.get('/opportunities/stats').then((r) => r.data.stats);

export const getOpportunity = (id) =>
  api.get(`/opportunities/${id}`).then((r) => r.data.opportunity);

export const createOpportunity = (payload) =>
  api.post('/opportunities', payload).then((r) => r.data.opportunity);

export const updateOpportunity = (id, payload) =>
  api.put(`/opportunities/${id}`, payload).then((r) => r.data.opportunity);

export const deleteOpportunity = (id) =>
  api.delete(`/opportunities/${id}`).then((r) => r.data);

export const addActivity = (id, text) =>
  api.post(`/opportunities/${id}/activity`, { text }).then((r) => r.data.opportunity);
