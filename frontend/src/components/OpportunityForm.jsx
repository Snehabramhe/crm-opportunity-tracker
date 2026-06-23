import { useState } from 'react';
import { STAGES, PRIORITIES } from '../constants.js';

// Format an ISO date to yyyy-mm-dd for <input type="date">.
function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

const EMPTY = {
  customerName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  requirement: '',
  estimatedValue: '',
  stage: 'New',
  priority: 'Medium',
  nextFollowUpDate: '',
  notes: '',
};

export default function OpportunityForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(initial
      ? {
          ...initial,
          estimatedValue: initial.estimatedValue ?? '',
          nextFollowUpDate: toDateInput(initial.nextFollowUpDate),
        }
      : {}),
  }));
  const [errors, setErrors] = useState({});

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = 'Customer / company name is required';
    if (!form.requirement.trim()) errs.requirement = 'Requirement summary is required';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      errs.contactEmail = 'Invalid email format';
    if (form.estimatedValue !== '' && Number(form.estimatedValue) < 0)
      errs.estimatedValue = 'Value must be non-negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Build a clean payload; omit empty optional fields.
    const payload = {
      customerName: form.customerName.trim(),
      requirement: form.requirement.trim(),
      stage: form.stage,
      priority: form.priority,
    };
    if (form.contactName.trim()) payload.contactName = form.contactName.trim();
    if (form.contactEmail.trim()) payload.contactEmail = form.contactEmail.trim();
    if (form.contactPhone.trim()) payload.contactPhone = form.contactPhone.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();
    if (form.estimatedValue !== '') payload.estimatedValue = Number(form.estimatedValue);
    if (form.nextFollowUpDate) payload.nextFollowUpDate = form.nextFollowUpDate;
    onSubmit(payload);
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" value={form[name]} onChange={onChange} {...props} />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('customerName', 'Customer / company *', { placeholder: 'Acme Corp' })}
        {field('contactName', 'Contact person', { placeholder: 'Jane Doe' })}
        {field('contactEmail', 'Contact email', { type: 'email', placeholder: 'jane@acme.com' })}
        {field('contactPhone', 'Contact phone', { placeholder: '+91 98765 43210' })}
      </div>

      <div>
        <label className="label" htmlFor="requirement">Requirement summary *</label>
        <textarea
          id="requirement"
          name="requirement"
          rows={2}
          className="input"
          value={form.requirement}
          onChange={onChange}
          placeholder="What does the customer need?"
        />
        {errors.requirement && <p className="mt-1 text-xs text-red-600">{errors.requirement}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {field('estimatedValue', 'Estimated value', { type: 'number', min: 0, placeholder: '0' })}
        <div>
          <label className="label" htmlFor="stage">Stage</label>
          <select id="stage" name="stage" className="input" value={form.stage} onChange={onChange}>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="priority">Priority</label>
          <select id="priority" name="priority" className="input" value={form.priority} onChange={onChange}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {field('nextFollowUpDate', 'Next follow-up date', { type: 'date' })}

      <div>
        <label className="label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="input"
          value={form.notes}
          onChange={onChange}
          placeholder="Any additional context…"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create opportunity'}
        </button>
      </div>
    </form>
  );
}
