import { useEffect, useState } from 'react';
import './Dashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function Companies() {
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  });

  /* =========================================================
     LOAD COMPANIES
  ========================================================= */

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE}/api/companies`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load companies'
        );
      }

      setCompanies(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        'Companies error:',
        err
      );

      setError(
        err.message ||
        'Unable to load companies'
      );

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadCompanies();
  }, []);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

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

  /* =========================================================
     OPEN CREATE FORM
  ========================================================= */

  const openCreateForm = () => {
    setEditingCompany(null);

    setForm({
      name: '',
      industry: '',
      phone: '',
      email: '',
      website: '',
      address: '',
    });

    setError('');
    setShowForm(true);
  };

  /* =========================================================
     OPEN EDIT FORM
  ========================================================= */

  const openEditForm = (company) => {
    setEditingCompany(company);

    setForm({
      name: company.name || '',
      industry: company.industry || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      address: company.address || '',
    });

    setError('');
    setShowForm(true);
  };

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingCompany(null);
  };

  /* =========================================================
     SAVE COMPANY
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.name.trim()) {
      setError(
        'Company name is required.'
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(editingCompany);

      const url = isEditing
        ? `${API_BASE}/api/companies/${editingCompany.id}`
        : `${API_BASE}/api/companies`;

      const response = await fetch(
        url,
        {
          method: isEditing
            ? 'PUT'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name:
              form.name.trim(),

            industry:
              form.industry.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email.trim(),

            website:
              form.website.trim(),

            address:
              form.address.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to save company'
        );
      }

      setShowForm(false);
      setEditingCompany(null);

      await loadCompanies();

    } catch (err) {
      console.error(
        'Save company error:',
        err
      );

      setError(
        err.message ||
        'Unable to save company'
      );

    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE COMPANY
  ========================================================= */

  const handleDelete = async (company) => {
    const confirmed =
      window.confirm(
        `Delete "${company.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      const response =
        await fetch(
          `${API_BASE}/api/companies/${company.id}`,
          {
            method: 'DELETE',
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to delete company'
        );
      }

      await loadCompanies();

    } catch (err) {
      console.error(
        'Delete company error:',
        err
      );

      setError(
        err.message ||
        'Unable to delete company'
      );
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <section className="dashboard">

        <div className="system-card">

          <span className="eyebrow">
            SALES
          </span>

          <h2>
            Loading Companies...
          </h2>

          <p>
            Retrieving companies from your CRM database.
          </p>

        </div>

      </section>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <section className="dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="welcome-card">

        <div>

          <span className="eyebrow">
            SALES
          </span>

          <h2>
            Companies
          </h2>

          <p>
            Organizations connected to your CRM.
          </p>

        </div>

        <div
          className="deals-header-actions"
        >

          <button
            className="primary-button"
            onClick={openCreateForm}
          >
            + Add Company
          </button>

          <button
            className="secondary-button"
            onClick={loadCompanies}
          >
            Refresh
          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="system-card">

          <h3
            style={{
              color: '#ff7070',
            }}
          >
            Unable to load data
          </h3>

          <p>
            {error}
          </p>

          <button
            className="secondary-button"
            onClick={() => {
              setError('');
              loadCompanies();
            }}
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          COMPANY SUMMARY
      ===================================================== */}

      <div className="pipeline-summary">

        <div className="pipeline-summary-card">

          <span>
            Total Companies
          </span>

          <strong>
            {companies.length}
          </strong>

          <small>
            Organizations in CRM
          </small>

        </div>

        <div className="pipeline-summary-card">

          <span>
            Contacts
          </span>

          <strong>
            {companies.reduce(
              (total, company) =>
                total +
                (company.contacts?.length || 0),
              0
            )}
          </strong>

          <small>
            Linked contacts
          </small>

        </div>

        <div className="pipeline-summary-card">

          <span>
            Deals
          </span>

          <strong>
            {companies.reduce(
              (total, company) =>
                total +
                (company.deals?.length || 0),
              0
            )}
          </strong>

          <small>
            Linked opportunities
          </small>

        </div>

      </div>

      {/* =====================================================
          COMPANIES TABLE
      ===================================================== */}

      <div className="system-card">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px',
          }}
        >

          <div>

            <h2>
              All Companies
            </h2>

            <p>
              {companies.length}{' '}
              {companies.length === 1
                ? 'company'
                : 'companies'}
            </p>

          </div>

          <button
            className="primary-button"
            onClick={openCreateForm}
          >
            + Add Company
          </button>

        </div>

        {companies.length === 0 ? (

          <div
            className="pipeline-empty"
          >
            No companies found.
          </div>

        ) : (

          <div
            style={{
              overflowX: 'auto',
            }}
          >

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >

              <thead>

                <tr>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px',
                    }}
                  >
                    Company
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px',
                    }}
                  >
                    Industry
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px',
                    }}
                  >
                    Contact
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px',
                    }}
                  >
                    Email
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '14px',
                    }}
                  >
                    Deals
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '14px',
                    }}
                  >
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {companies.map(
                  (company) => {

                    const contactCount =
                      company.contacts?.length ||
                      0;

                    const dealCount =
                      company.deals?.length ||
                      0;

                    return (
                      <tr
                        key={company.id}
                      >

                        <td
                          style={{
                            padding: '14px',
                          }}
                        >

                          <strong>
                            {company.name ||
                              'Unnamed Company'}
                          </strong>

                        </td>

                        <td
                          style={{
                            padding: '14px',
                          }}
                        >
                          {company.industry ||
                            '—'}
                        </td>

                        <td
                          style={{
                            padding: '14px',
                          }}
                        >
                          {company.phone ||
                            '—'}
                        </td>

                        <td
                          style={{
                            padding: '14px',
                          }}
                        >
                          {company.email ||
                            '—'}
                        </td>

                        <td
                          style={{
                            padding: '14px',
                          }}
                        >
                          {dealCount}
                        </td>

                        <td
                          style={{
                            padding: '14px',
                            textAlign: 'right',
                          }}
                        >

                          <div
                            style={{
                              display: 'flex',
                              justifyContent:
                                'flex-end',
                              gap: '8px',
                            }}
                          >

                            <button
                              className="secondary-button"
                              onClick={() =>
                                openEditForm(
                                  company
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="secondary-button"
                              onClick={() =>
                                handleDelete(
                                  company
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={closeForm}
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
                  CRM
                </span>

                <h2>
                  {editingCompany
                    ? 'Edit Company'
                    : 'Add Company'}
                </h2>

                <p>
                  {editingCompany
                    ? 'Update company information.'
                    : 'Add a new organization to your CRM.'}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {error && (
              <div className="form-message error">
                {error}
              </div>
            )}

            <form
              className="customer-form"
              onSubmit={handleSubmit}
            >

              {/* COMPANY NAME */}

              <div className="form-field">

                <label>
                  Company Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                  required
                />

              </div>

              {/* INDUSTRY */}

              <div className="form-field">

                <label>
                  Industry
                </label>

                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Technology"
                />

              </div>

              {/* PHONE */}

              <div className="form-field">

                <label>
                  Phone
                </label>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />

              </div>

              {/* EMAIL */}

              <div className="form-field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                />

              </div>

              {/* WEBSITE */}

              <div className="form-field">

                <label>
                  Website
                </label>

                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://company.com"
                />

              </div>

              {/* ADDRESS */}

              <div className="form-field">

                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Mumbai, Maharashtra"
                  rows="3"
                />

              </div>

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
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
                    ? 'Saving...'
                    : editingCompany
                      ? 'Save Changes'
                      : 'Create Company'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </section>
  );
}

export default Companies;