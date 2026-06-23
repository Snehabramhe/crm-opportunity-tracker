import { z } from 'zod';
import { STAGES, PRIORITIES } from '../models/Opportunity.js';

// Coerce empty strings to undefined so optional fields are truly optional.
const optionalString = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().trim().optional()
);

const optionalEmail = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().trim().toLowerCase().email('Invalid contact email format').optional()
);

const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.date({ invalid_type_error: 'Invalid date' }).optional()
);

const optionalValue = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.number().min(0, 'Estimated value must be non-negative').optional()
);

// Note: `owner` / `user_id` / `created_by` are intentionally NOT part of the schema,
// so they are stripped from the request body and can never override the JWT identity.
export const createOpportunitySchema = z.object({
  customerName: z.string().trim().min(1, 'Customer / company name is required'),
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalString,
  requirement: z.string().trim().min(1, 'Requirement summary is required'),
  estimatedValue: optionalValue,
  stage: z.enum(STAGES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  nextFollowUpDate: optionalDate,
  notes: optionalString,
});

// All fields optional on update; at least one must be present.
export const updateOpportunitySchema = createOpportunitySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required to update' }
);

export const activitySchema = z.object({
  text: z.string().trim().min(1, 'Activity note text is required'),
});
