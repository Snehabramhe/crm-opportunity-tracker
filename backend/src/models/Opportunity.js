import mongoose from 'mongoose';

export const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
export const PRIORITIES = ['Low', 'Medium', 'High'];

const activitySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const opportunitySchema = new mongoose.Schema(
  {
    // Set from the authenticated user (JWT) only — never from the request body.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer / company name is required'],
      trim: true,
    },
    contactName: { type: String, trim: true },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid contact email format'],
    },
    contactPhone: { type: String, trim: true },
    requirement: {
      type: String,
      required: [true, 'Requirement summary is required'],
      trim: true,
    },
    estimatedValue: {
      type: Number,
      min: [0, 'Estimated value must be non-negative'],
      default: 0,
    },
    stage: {
      type: String,
      enum: { values: STAGES, message: 'Invalid stage: {VALUE}' },
      default: 'New',
      index: true,
    },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: 'Invalid priority: {VALUE}' },
      default: 'Medium',
      index: true,
    },
    nextFollowUpDate: { type: Date },
    notes: { type: String, trim: true },
    activity: { type: [activitySchema], default: [] },
  },
  { timestamps: true }
);

// Text index to support search across customer name and requirement.
opportunitySchema.index({ customerName: 'text', requirement: 'text' });

opportunitySchema.set('toJSON', { virtuals: true, versionKey: false });

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

export default Opportunity;
