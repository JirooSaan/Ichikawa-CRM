import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000';

function CreateDeal({
  onClose,
  onCreated,
}) {
  const [stages, setStages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'JPY',
    stageId: '',
    contactId: '',
    companyId: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* =====================================================
     LOAD LOCAL CRM DATA
  ===================================================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          stagesResponse,
          contactsResponse,
          companiesResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/deal-stages`),
          fetch(`${API_BASE}/api/contacts`),
          fetch(`${API_BASE}/api/companies`),
        ]);

        const stagesData =
          await stagesResponse.json();

        const contactsData =
          await contactsResponse.json();

        const companiesData =
          await companiesResponse.json();

        if (!stagesResponse.ok) {
          throw new Error(
            stagesData?.message ||
            stagesData?.error ||
            'Failed to load deal stages'
          );
        }

        if (!contactsResponse.ok) {
          throw new Error(
            contactsData?.message ||
            contactsData?.error ||
            'Failed to load contacts'
          );
        }

        if (!companiesResponse.ok) {
          throw new Error(
            companiesData?.message ||
            companiesData?.error ||
            'Failed to load companies'
          );
        }

        const stageResults =
          Array.isArray(stagesData)
            ? stagesData
            : [];

        const contactResults =
          Array.isArray(contactsData)
            ? contactsData
            : [];

        const companyResults =
          Array.isArray(companiesData)
            ? companiesData
            : [];

        setStages(stageResults);
        setContacts(contactResults);
        setCompanies(companyResults);

        if (stageResults.length > 0) {
          setForm((current) => ({
            ...current,
            stageId: stageResults[0].id,
          }));
        }

      } catch (err) {
        console.error(
          'Create deal loading error:',
          err
        );

        setError(
          err.message ||
          'Unable to load CRM data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* =====================================================
     CHANGE HANDLER
  ===================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.title.trim()) {
      setError(
        'Deal title is required.'
      );
      return;
    }

    if (!form.amount) {
      setError(
        'Deal amount is required.'
      );
      return;
    }

    if (!form.companyId) {
      setError(
        'Company is required.'
      );
      return;
    }

    if (!form.stageId) {
      setError(
        'Deal stage is required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/api/deals`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            title:
              form.title.trim(),

            description:
              form.description.trim() ||
              null,

            companyId:
              form.companyId,

            contactId:
              form.contactId ||
              null,

            stageId:
              form.stageId,

            amount:
              form.amount,

            currency:
              form.currency || 'INR',
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to create deal'
        );
      }

      if (onCreated) {
        onCreated(data);
      }

    } catch (err) {
      console.error(
        'Create deal error:',
        err
      );

      setError(
        err.message ||
        'Unable to create deal'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="deal-form-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="modal-header">

          <div>
            <span className="eyebrow">
              SALES PIPELINE
            </span>

            <h2>
              Create Deal
            </h2>

            <p>
              Add a new opportunity
              to your CRM.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="deal-form-loading">
            Loading CRM data...
          </div>
        ) : (
          <form
            className="customer-form"
            onSubmit={handleSubmit}
          >

            {/* DEAL TITLE */}

            <div className="form-field">

              <label>
                Deal Name
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Acme CRM Implementation"
              />

            </div>

            {/* DESCRIPTION */}

            <div className="form-field">

              <label>
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the opportunity..."
                rows="3"
              />

            </div>

            {/* AMOUNT + CURRENCY */}

            <div className="form-row">

              <div className="form-field">

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="500000"
                />

              </div>

              <div className="form-field">

                <label>
                  Currency
                </label>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                >
                  <option value="JPY">
                    JPY — ¥
                    </option>
                  
                  <option value="INR">
                    INR — ₹
                  </option>

                  <option value="USD">
                    USD — $
                  </option>

                  <option value="EUR">
                    EUR — €
                  </option>

                  <option value="GBP">
                    GBP — £
                  </option>
                </select>

              </div>

            </div>

            {/* COMPANY */}

            <div className="form-field">

              <label>
                Company
              </label>

              <select
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
              >

                <option value="">
                  Select company
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* CONTACT */}

            <div className="form-field">

              <label>
                Contact
              </label>

              <select
                name="contactId"
                value={form.contactId}
                onChange={handleChange}
              >

                <option value="">
                  No contact
                </option>

                {contacts.map(
                  (contact) => {

                    const name = [
                      contact.firstName,
                      contact.lastName,
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <option
                        key={contact.id}
                        value={contact.id}
                      >
                        {name ||
                          contact.email ||
                          `Contact ${contact.id}`}
                      </option>
                    );
                  }
                )}

              </select>

            </div>

            {/* STAGE */}

            <div className="form-field">

              <label>
                Deal Stage
              </label>

              <select
                name="stageId"
                value={form.stageId}
                onChange={handleChange}
              >

                <option value="">
                  Select stage
                </option>

                {stages.map(
                  (stage) => (
                    <option
                      key={stage.id}
                      value={stage.id}
                    >
                      {stage.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* ACTIONS */}

            <div className="modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? 'Creating...'
                  : 'Create Deal'}
              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default CreateDeal;