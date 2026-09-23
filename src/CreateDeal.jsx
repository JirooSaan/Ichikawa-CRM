import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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

  reviewStatus: 'NOT_STARTED',
  deadline: '',
  estimatedCost: '',
  expectedProfit: '',
  expectedMargin: '',
  customerTargetPrice: '',
  minimumPrice: '',
  currentOffer: '',
  negotiationNotes: '',
  riskNotes: '',
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
  title: form.title.trim(),

  description:
    form.description.trim() || null,

  companyId:
    form.companyId,

  contactId:
    form.contactId || null,

  stageId:
    form.stageId,

  amount:
    form.amount,

  currency:
    form.currency || 'JPY',

  reviewStatus:
    form.reviewStatus || 'NOT_STARTED',

  deadline:
    form.deadline || null,

  estimatedCost:
    form.estimatedCost || null,

  expectedProfit:
    form.expectedProfit || null,

  expectedMargin:
    form.expectedMargin || null,

  customerTargetPrice:
    form.customerTargetPrice || null,

  minimumPrice:
    form.minimumPrice || null,

  currentOffer:
    form.currentOffer || null,

  negotiationNotes:
    form.negotiationNotes.trim() || null,

  riskNotes:
    form.riskNotes.trim() || null,
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
  JPY — Japanese Yen (¥)
</option>

<option value="USD">
  USD — US Dollar ($)
</option>

<option value="EUR">
  EUR — Euro (€)
</option>

<option value="GBP">
  GBP — British Pound (£)
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
                        {/* DEAL REVIEW */}

            <div className="form-section">

              <div className="form-section-header">
                <span className="eyebrow">
                  DEAL REVIEW
                </span>

                <h3>
                  Commercial Review
                </h3>

                <p>
                  Capture pricing, profitability,
                  deadline, and negotiation details.
                </p>
              </div>

              {/* REVIEW STATUS */}

              <div className="form-field">

                <label>
                  Review Status
                </label>

                <select
                  name="reviewStatus"
                  value={form.reviewStatus}
                  onChange={handleChange}
                >
                  <option value="NOT_STARTED">
                    Not Started
                  </option>

                  <option value="IN_REVIEW">
                    In Review
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="OVERRIDDEN">
                    Overridden
                  </option>
                </select>

              </div>

              {/* DEADLINE */}

              <div className="form-field">

                <label>
                  Review Deadline
                </label>

                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                />

              </div>

              {/* COST + PROFIT */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Estimated Cost
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="estimatedCost"
                    value={form.estimatedCost}
                    onChange={handleChange}
                    placeholder="3500000"
                  />

                </div>

                <div className="form-field">

                  <label>
                    Expected Profit
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="expectedProfit"
                    value={form.expectedProfit}
                    onChange={handleChange}
                    placeholder="3300000"
                  />

                </div>

              </div>

              {/* MARGIN */}

              <div className="form-field">

                <label>
                  Expected Margin (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  name="expectedMargin"
                  value={form.expectedMargin}
                  onChange={handleChange}
                  placeholder="48.5"
                />

              </div>

              {/* TARGET + MINIMUM */}

              <div className="form-row">

                <div className="form-field">

                  <label>
                    Customer Target Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="customerTargetPrice"
                    value={form.customerTargetPrice}
                    onChange={handleChange}
                    placeholder="7200000"
                  />

                </div>

                <div className="form-field">

                  <label>
                    Minimum Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="minimumPrice"
                    value={form.minimumPrice}
                    onChange={handleChange}
                    placeholder="6100000"
                  />

                </div>

              </div>

              {/* CURRENT OFFER */}

              <div className="form-field">

                <label>
                  Current Offer
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="currentOffer"
                  value={form.currentOffer}
                  onChange={handleChange}
                  placeholder="6800000"
                />

              </div>

              {/* NEGOTIATION NOTES */}

              <div className="form-field">

                <label>
                  Negotiation Notes
                </label>

                <textarea
                  name="negotiationNotes"
                  value={form.negotiationNotes}
                  onChange={handleChange}
                  placeholder="Record customer position, negotiation history, or next pricing discussion..."
                  rows="3"
                />

              </div>

              {/* RISK NOTES */}

              <div className="form-field">

                <label>
                  Risk Notes
                </label>

                <textarea
                  name="riskNotes"
                  value={form.riskNotes}
                  onChange={handleChange}
                  placeholder="Record commercial, technical, delivery, or pricing risks..."
                  rows="3"
                />

              </div>

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