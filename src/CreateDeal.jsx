import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000';

function CreateDeal({
  onClose,
  onCreated,
}) {
  const [pipelines, setPipelines] =
    useState([]);

  const [contacts, setContacts] =
    useState([]);

  const [companies, setCompanies] =
    useState([]);

  const [form, setForm] = useState({
    dealname: '',
    amount: '',
    pipeline: '',
    dealstage: '',
    closedate: '',
    contactId: '',
    companyId: '',
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | Load pipelines + contacts + companies
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          pipelinesResponse,
          contactsResponse,
          companiesResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/api/hubspot/pipelines`
          ),

          fetch(
            `${API_BASE}/api/hubspot/contacts`
          ),

          fetch(
            `${API_BASE}/api/hubspot/companies`
          ),
        ]);

        const pipelinesData =
          await pipelinesResponse.json();

        const contactsData =
          await contactsResponse.json();

        const companiesData =
          await companiesResponse.json();

        if (!pipelinesResponse.ok) {
          throw new Error(
            pipelinesData?.message ||
            'Failed to load pipelines'
          );
        }

        if (!contactsResponse.ok) {
          throw new Error(
            contactsData?.message ||
            'Failed to load contacts'
          );
        }

        if (!companiesResponse.ok) {
          throw new Error(
            companiesData?.message ||
            'Failed to load companies'
          );
        }

        const pipelineResults =
          pipelinesData.results || [];

        const contactResults =
          contactsData.results || [];

        const companyResults =
          companiesData.results || [];

        setPipelines(
          pipelineResults
        );

        setContacts(
          contactResults
        );

        setCompanies(
          companyResults
        );

        // --------------------------------------------------------
        // Select first pipeline/stage automatically
        // --------------------------------------------------------

        if (pipelineResults.length) {
          const firstPipeline =
            pipelineResults[0];

          const firstStage =
            firstPipeline.stages?.[0];

          setForm((current) => ({
            ...current,

            pipeline:
              firstPipeline.id,

            dealstage:
              firstStage?.id || '',
          }));
        }

      } catch (err) {
        console.error(
          'Create deal loading error:',
          err
        );

        setError(
          err.message ||
          'Unable to load deal information'
        );

      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Selected pipeline
  |--------------------------------------------------------------------------
  */

  const selectedPipeline =
    pipelines.find(
      (item) =>
        item.id === form.pipeline
    );

  const stages =
    selectedPipeline?.stages || [];

  /*
  |--------------------------------------------------------------------------
  | Change handler
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Pipeline change
  |--------------------------------------------------------------------------
  */

  const handlePipelineChange =
    (event) => {
      const pipelineId =
        event.target.value;

      const pipeline =
        pipelines.find(
          (item) =>
            item.id === pipelineId
        );

      setForm((current) => ({
        ...current,

        pipeline:
          pipelineId,

        dealstage:
          pipeline?.stages?.[0]?.id ||
          '',
      }));

      setError('');
    };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError('');

    if (!form.dealname.trim()) {
      setError(
        'Deal name is required.'
      );
      return;
    }

    if (!form.amount) {
      setError(
        'Deal amount is required.'
      );
      return;
    }

    if (!form.pipeline) {
      setError(
        'Pipeline is required.'
      );
      return;
    }

    if (!form.dealstage) {
      setError(
        'Deal stage is required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${API_BASE}/api/hubspot/deals`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              dealname:
                form.dealname,

              amount:
                form.amount,

              pipeline:
                form.pipeline,

              dealstage:
                form.dealstage,

              closedate:
                form.closedate ||
                null,

              contactId:
                form.contactId ||
                null,

              companyId:
                form.companyId ||
                null,
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
        onCreated(
          data.deal
        );
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
              to your HubSpot pipeline.
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

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="deal-form-loading">
            Loading CRM data...
          </div>
        ) : (
          <form
            className="customer-form"
            onSubmit={handleSubmit}
          >

            {/* Deal Name */}

            <div className="form-field">

              <label>
                Deal Name
              </label>

              <input
                name="dealname"
                value={form.dealname}
                onChange={handleChange}
                placeholder="Kanto Facility Expansion"
              />

            </div>

            {/* Amount */}

            <div className="form-field">

              <label>
                Amount (USD)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="1100000"
              />

            </div>

            {/* Contact */}

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

                    const firstName =
                      contact.properties
                        ?.firstname || '';

                    const lastName =
                      contact.properties
                        ?.lastname || '';

                    const email =
                      contact.properties
                        ?.email || '';

                    const name =
                      `${firstName} ${lastName}`
                        .trim();

                    return (
                      <option
                        key={contact.id}
                        value={contact.id}
                      >
                        {name ||
                          email ||
                          `Contact ${contact.id}`}
                      </option>
                    );
                  }
                )}

              </select>

            </div>

            {/* Company */}

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
                  No company
                </option>

                {companies.map(
                  (company) => {

                    const name =
                      company.properties
                        ?.name ||
                      'Unnamed company';

                    const domain =
                      company.properties
                        ?.domain || '';

                    return (
                      <option
                        key={company.id}
                        value={company.id}
                      >
                        {name}
                        {domain
                          ? ` — ${domain}`
                          : ''}
                      </option>
                    );
                  }
                )}

              </select>

            </div>

            {/* Pipeline + Stage */}

            <div className="form-row">

              <div className="form-field">

                <label>
                  Pipeline
                </label>

                <select
                  name="pipeline"
                  value={form.pipeline}
                  onChange={
                    handlePipelineChange
                  }
                >

                  {pipelines.map(
                    (pipeline) => (
                      <option
                        key={pipeline.id}
                        value={pipeline.id}
                      >
                        {pipeline.label ||
                          pipeline.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="form-field">

                <label>
                  Stage
                </label>

                <select
                  name="dealstage"
                  value={form.dealstage}
                  onChange={handleChange}
                >

                  {stages.map(
                    (stage) => (
                      <option
                        key={stage.id}
                        value={stage.id}
                      >
                        {stage.label}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            {/* Close Date */}

            <div className="form-field">

              <label>
                Expected Close Date
              </label>

              <input
                type="date"
                name="closedate"
                value={form.closedate}
                onChange={handleChange}
              />

            </div>

            {/* Actions */}

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