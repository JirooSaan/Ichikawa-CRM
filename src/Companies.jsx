import { useEffect, useMemo, useState } from 'react';
import { UserButton, useUser } from '@clerk/react';

function Companies() {
  const { user } = useUser();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const name =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ') ||
    user?.username ||
    'User';

  const email =
    user?.primaryEmailAddress?.emailAddress || '';

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/hubspot/companies');

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          `Backend returned ${response.status}: ${text}`
        );
      }

      const data = await response.json();

      console.log('HubSpot companies:', data);

      setCompanies(
        Array.isArray(data.results)
          ? data.results
          : []
      );
    } catch (err) {
      console.error('Companies error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load companies'
      );

      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return companies;
    }

    return companies.filter((company) => {
      const properties = company.properties || {};

      return [
        properties.name,
        properties.domain,
        properties.industry,
        properties.phone,
        properties.city,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [companies, search]);

  return (
    <div className="crm-app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">◆</div>

          <div>
            <div className="brand-name">
              ICHIKAWA SOLUTIONS LTD.
            </div>

            <div className="brand-subtitle">
              MANAGER
            </div>
          </div>
        </div>

        <nav className="navigation">

          <div className="nav-section">
            MAIN
          </div>

          <button
            className="nav-item"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <span>▦</span>
            Dashboard
          </button>

          <div className="nav-section">
            SALES
          </div>

          <button
            className="nav-item"
            onClick={() => {
              window.location.href = '/contacts';
            }}
          >
            <span>◉</span>
            Contacts
          </button>

          <button className="nav-item active">
            <span>◈</span>
            Companies
          </button>

          <button
            className="nav-item"
            onClick={() => {
              window.location.href = '/deals';
            }}
          >
            <span>◆</span>
            Deals
          </button>

          <div className="nav-section">
            SUPPORT
          </div>

          <button className="nav-item">
            <span>◌</span>
            Tickets
          </button>

          <div className="nav-section">
            INTEGRATIONS
          </div>

          <button className="nav-item">
            <span>⬡</span>
            HubSpot
          </button>

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          Clerk authenticated
        </div>

      </aside>

      {/* Main */}
      <main className="main-content">

        <header className="topbar">

          <div>
            <h1>Companies</h1>
            <p>HubSpot CRM companies</p>
          </div>

          <div className="user-area">

            <div className="user-info">
              <strong>{name}</strong>
              <span>{email}</span>
            </div>

            <UserButton />

          </div>

        </header>

        <section className="dashboard">

          <div className="welcome-card">

            <div>
              <span className="eyebrow">
                HUBSPOT CRM
              </span>

              <h2>Companies</h2>

              <p>
                Organizations retrieved directly from
                HubSpot.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={loadCompanies}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>

          </div>

          <div className="search-card">

            <input
              type="text"
              placeholder="Search companies by name, domain or industry..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {error && (
            <div className="error-card">

              <h3>Unable to load companies</h3>

              <p>{error}</p>

            </div>
          )}

          <div className="system-card">

            <div className="table-header">

              <h2>HubSpot Companies</h2>

              <span>
                {filteredCompanies.length} companies
              </span>

            </div>

            {loading ? (
              <div className="empty-state">
                Loading companies...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="empty-state">
                No companies found.
              </div>
            ) : (
              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Domain</th>
                      <th>Industry</th>
                      <th>Phone</th>
                      <th>Location</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredCompanies.map(
                      (company) => {

                        const p =
                          company.properties || {};

                        return (
                          <tr key={company.id}>

                            <td>
                              <strong>
                                {p.name ||
                                  'Unnamed company'}
                              </strong>
                            </td>

                            <td>
                              {p.domain || '—'}
                            </td>

                            <td>
                              {p.industry || '—'}
                            </td>

                            <td>
                              {p.phone || '—'}
                            </td>

                            <td>
                              {[
                                p.city,
                                p.state,
                                p.country,
                              ]
                                .filter(Boolean)
                                .join(', ') || '—'}
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

        </section>

      </main>

    </div>
  );
}

export default Companies;