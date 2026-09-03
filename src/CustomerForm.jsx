import { useState } from 'react';

const API_BASE = 'http://localhost:5000';

function CustomerForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    company: '',
    jobtitle: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.firstname.trim()) {
      setError('First name is required.');
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/hubspot/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to create customer.'
        );
      }

      setSuccess(
        'Customer created successfully in HubSpot.'
      );

      if (onCreated) {
        onCreated(data.contact);
      }

    } catch (err) {
      console.error('Create customer error:', err);

      setError(
        err.message ||
        'Unable to create customer.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">

      <div className="customer-modal">

        <div className="modal-header">

          <div>
            <span className="eyebrow">
              HUBSPOT CRM
            </span>

            <h2>
              Create Customer
            </h2>

            <p>
              Add a new contact directly to HubSpot.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>

        </div>

        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >

          <div className="form-row">

            <div className="form-field">
              <label>
                First Name *
              </label>

              <input
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                placeholder="Emily"
                autoComplete="given-name"
                required
              />
            </div>

            <div className="form-field">
              <label>
                Last Name
              </label>

              <input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                placeholder="Carter"
                autoComplete="family-name"
              />
            </div>

          </div>

          <div className="form-field">
            <label>
              Company Name
            </label>

            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Kanto Smart Facilities"
            />
          </div>

          <div className="form-field">
            <label>
              Role / Job Title
            </label>

            <input
              name="jobtitle"
              value={form.jobtitle}
              onChange={handleChange}
              placeholder="Facilities Manager"
            />
          </div>

          <div className="form-field">
            <label>
              Email *
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="emily@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label>
              Contact Number
            </label>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555 123 4567"
              autoComplete="tel"
            />
          </div>

          <div className="form-row">

            <div className="form-field">
              <label>
                Country
              </label>

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="United States"
              />
            </div>

            <div className="form-field">
              <label>
                City
              </label>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="New York"
              />
            </div>

          </div>

          <div className="form-field">
            <label>
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional customer information..."
              rows="4"
            />
          </div>

          {error && (
            <div className="form-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="form-message success">
              {success}
            </div>
          )}

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? 'Creating...'
                : 'Create Customer'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CustomerForm;
