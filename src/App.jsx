import { useEffect, useState } from 'react';
import { useAuth, useUser, UserButton, SignIn, SignUp} from '@clerk/react';
import Deals from './Deals';
import './App.css';
import './Dashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Local CRM API helpers. The endpoints may return either a plain array
// or an object such as { results: [...] } / { data: [...] }.
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getEntityName = (entity) => {
  if (!entity) return '';
  return (
    entity.name ||
    entity.title ||
    entity.companyName ||
    entity.fullName ||
    ''
  );
};

const normalizeContact = (contact) => {
  const source = contact || {};
  const properties = source.properties || {};

  return {
    ...source,
    properties: {
      ...properties,
      firstname:
        properties.firstname ??
        source.firstName ??
        source.firstname ??
        '',
      lastname:
        properties.lastname ??
        source.lastName ??
        source.lastname ??
        '',
      email:
        properties.email ??
        source.email ??
        '',
      phone:
        properties.phone ??
        source.phone ??
        '',
      company:
        properties.company ??
        source.companyName ??
        getEntityName(source.company) ??
        '',
      jobtitle:
        properties.jobtitle ??
        source.jobTitle ??
        source.jobtitle ??
        '',
      city:
        properties.city ??
        source.city ??
        '',
      country:
        properties.country ??
        source.country ??
        '',
    },
  };
};

const normalizeCompany = (company) => {
  const source = company || {};
  const properties = source.properties || {};

  return {
    ...source,
    properties: {
      ...properties,
      name:
        properties.name ??
        source.name ??
        '',
      domain:
        properties.domain ??
        source.domain ??
        source.website ??
        '',
      industry:
        properties.industry ??
        source.industry ??
        '',
      city:
        properties.city ??
        source.city ??
        '',
    },
  };
};

const normalizeDeal = (deal) => {
  const source = deal || {};
  const stageId =
    source.stageId ??
    source.stage?.id ??
    source.stage ??
    '';

  const contact =
    source.contact ||
    source.contacts?.[0] ||
    null;

  const company =
    source.company ||
    source.companies?.[0] ||
    null;

  return {
    ...source,
    name:
      source.name ||
      source.title ||
      source.dealname ||
      'Unnamed Deal',
    pipeline: 'local',
    stage: stageId,
    amount: Number(
      source.amount ??
      source.value ??
      0
    ),
    contacts: contact
      ? [normalizeContact(contact)]
      : [],
    companies: company
      ? [normalizeCompany(company)]
      : [],
  };
};

const normalizeStage = (stage, index) => {
  const source = stage || {};
  const label =
    source.label ||
    source.name ||
    source.title ||
    `Stage ${index + 1}`;

  const lower =
    String(label).toLowerCase();

  const explicitClosed =
    source.isClosed ??
    source.closed ??
    source.metadata?.isClosed;

  const explicitWon =
    source.isWon ??
    source.won ??
    source.metadata?.isWon;

  const isWon =
    explicitWon !== undefined
      ? Boolean(explicitWon)
      : /won|closed.?won|success/.test(lower);

  const isLost =
    /lost|closed.?lost|failure/.test(lower);

  return {
    ...source,
    id: source.id ?? String(index),
    name: label,
    label,
    order: source.order ?? index,
    metadata: {
      ...(source.metadata || {}),
      isClosed:
        explicitClosed !== undefined
          ? Boolean(explicitClosed)
          : isWon || isLost,
      isWon: isWon ? true : isLost ? false : undefined,
    },
  };
};



function App() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [activePage, setActivePage] = useState('dashboard');
  const [authMode, setAuthMode] = useState('signin');
  const [clientOnboarding, setClientOnboarding] = useState(false);
  const [clientCompany, setClientCompany] = useState('');
  const [clientError, setClientError] = useState(''); 
  const [clientProvisioning, setClientProvisioning] = useState(false); 
  const [provisionCheck, setProvisionCheck] = useState(true);
 useEffect(() => {
  if (!isSignedIn) {
    setProvisionCheck(false);
    return;
  }

  const pendingClientSignup =
    sessionStorage.getItem('crm_client_signup_pending') === '1';

  if (pendingClientSignup) {
    setAuthMode('signup');
    setClientOnboarding(true);
  }

  let cancelled = false;

  const checkCRMProvisioning = async () => {
    try {
      const response = await apiFetch(
        `${API_BASE}/api/access/me`
      );

      if (cancelled) return;

      if (response.ok) {
        // Already provisioned.
        sessionStorage.removeItem(
          'crm_client_signup_pending'
        );
        setClientOnboarding(false);
        setProvisionCheck(false);
        return;
      }

      if (response.status === 403) {
        // Authenticated with Clerk, but not provisioned
        // in the CRM database.
        setAuthMode('signup');
        setClientOnboarding(true);
        setProvisionCheck(false);
        return;
      }

      setProvisionCheck(false);
    } catch (error) {
      console.error(
        'CRM provisioning check failed:',
        error
      );

      if (!cancelled) {
        setProvisionCheck(false);
      }
    }
  };

  checkCRMProvisioning();

  return () => {
    cancelled = true;
  };
}, [isSignedIn]);

  const apiFetch = async (url, options = {}) => {
    const token = await getToken();
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body) headers.set('Content-Type', 'application/json');
    return fetch(url, { ...options, headers, credentials: 'include' });
  };

  if (!isLoaded) {
    return (
      <div className="app-loading">
        Loading CRM...
      </div>
    );
  }
if (!isSignedIn || provisionCheck ||(authMode === 'signup' && clientOnboarding)) {
  return (
    <div className="auth-page">
      {authMode === 'signin' && (
        <div className="auth-wrapper">
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorBackground: '#101010',
                colorText: '#f5f0e8',
                colorTextSecondary: '#b8b0a5',
                colorPrimary: '#d69b3c',
              },
              elements: {
                rootBox: 'auth-container',
                card: 'auth-card',
                headerTitle: 'auth-title',
                headerSubtitle: 'auth-subtitle',
                formFieldLabel: 'auth-label',
                formFieldInput: 'auth-input',
                formButtonPrimary: 'auth-button',
                footerActionLink: 'auth-link',
              },
            }}
          />

          <button
            type="button"
            className="client-signup-trigger"
           onClick={() => {
  sessionStorage.setItem(
    'crm_client_signup_pending',
    '1'
  );

  setAuthMode('signup');
  setClientError('');
}}
          >
            New client? <strong>Create Client Account</strong>
          </button>
        </div>
      )}

      {authMode === 'signup' && !clientOnboarding && (
        <div className="auth-wrapper">
          <SignUp
            routing="hash"
            signInUrl="/"
            appearance={{
              variables: {
                colorBackground: '#101010',
                colorText: '#ffffff',
                colorTextSecondary: '#ffffff',
                colorPrimary: '#d69b3c',
              },
              elements: {
                rootBox: 'auth-container',
                card: 'auth-card',
                headerTitle: 'auth-title',
                headerSubtitle: 'auth-subtitle',
                formFieldLabel: 'auth-label',
                formFieldInput: 'auth-input',
                formButtonPrimary: 'auth-button',
                footerActionLink: 'auth-link',
              },
            }}
          />

          <button
            type="button"
            className="client-signup-trigger"
            onClick={() => {
              sessionStorage.removeItem('crm_client_signup_pending');
              setAuthMode('signin');
              setClientOnboarding(false);
              setClientError('');
            }}
          >
            Already have an account? <strong>Back to Sign In</strong>
          </button>
        </div>
      )}

      {authMode === 'signup' && clientOnboarding && (
        <div className="auth-card client-onboarding-card">
          <div className="client-onboarding-header">
            <span className="eyebrow">CLIENT ONBOARDING</span>
            <h1>Complete Your Account</h1>
            <p>
              Tell us which company or organization you represent.
            </p>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault();

              setClientError('');

              if (!clientCompany.trim()) {
                setClientError(
                  'Company / organization name is required.'
                );
                return;
              }

              try {
                setClientProvisioning(true);

                const response = await apiFetch(
                  `${API_BASE}/api/access/provision-client`,
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      companyName: clientCompany.trim(),
                      name:
                        [user?.firstName, user?.lastName]
                          .filter(Boolean)
                          .join(' ') ||
                        user?.username ||
                        'Client User',
                      email:
                        user?.primaryEmailAddress?.emailAddress ||
                        '',
                    }),
                  }
                );

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(
                    data?.error ||
                    'Unable to create your CRM account.'
                  );
                }

               sessionStorage.removeItem('crm_client_signup_pending');
               window.location.reload(); 
              } catch (error) {
                console.error(
                  'Client provisioning error:',
                  error
                );

                setClientError(
                  error.message ||
                  'Unable to complete account setup.'
                );
              } finally {
                setClientProvisioning(false);
              }
            }}
          >
            <label className="auth-label">
              Company / Organization
            </label>

            <input
              className="auth-input"
              type="text"
              value={clientCompany}
              onChange={(event) =>
                setClientCompany(event.target.value)
              }
              placeholder="Sakura Precision Systems"
              autoFocus
            />

            {clientError && (
              <div className="client-auth-error">
                {clientError}
              </div>
            )}

            <button
              type="submit"
              className="auth-button client-onboarding-button"
              disabled={clientProvisioning}
            >
              {clientProvisioning
                ? 'Setting up account...'
                : 'Complete Client Account'}
            </button>
          </form>

          <button
            type="button"
            className="client-signup-trigger"
           onClick={() => {
  sessionStorage.removeItem(
    'crm_client_signup_pending'
  );

  setAuthMode('signin');
  setClientOnboarding(false);
  setClientCompany('');
  setClientError('');
}}
          >
            ← Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
}
  const email =
    user?.primaryEmailAddress?.emailAddress || 'No email';

  const name =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ') ||
    user?.username ||
    'User';

  const renderPage = () => {
    switch (activePage) {
      case 'contacts':
        return <ContactsPage apiFetch={apiFetch} />;

      case 'companies':
        return <CompaniesPage apiFetch={apiFetch} />;

      case 'deals':
        return <Deals apiFetch={apiFetch} />;

      case 'settings':
        return (
          <SimplePage
            title="Settings"
            subtitle="CRM configuration and preferences"
          />
        );

      default:
        return (
          <Dashboard
            name={name}
            onNavigate={setActivePage}
            apiFetch={apiFetch}
          />
        );
    }
  };

  return (
    <div className="crm-app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon" aria-hidden="true">
            IS
          </div>

          <div>
            <div className="brand-name">
              ICHIKAWA SOLUTIONS
            </div>

            <div className="brand-subtitle">
              Ichikawa Soln. Ltd
            </div>
          </div>

        </div>

        <nav className="navigation">

          <div className="nav-section">
            MAIN
          </div>

          <NavButton
            icon=""
            label="Dashboard"
            active={activePage === 'dashboard'}
            onClick={() => setActivePage('dashboard')}
          />

          <div className="nav-section">
            SALES
          </div>

          <NavButton
            icon=""
            label="Contacts"
            active={activePage === 'contacts'}
            onClick={() => setActivePage('contacts')}
          />

          <NavButton
            icon=""
            label="Companies"
            active={activePage === 'companies'}
            onClick={() => setActivePage('companies')}
          />

          <NavButton
            icon=""
            label="Deals"
            active={activePage === 'deals'}
            onClick={() => setActivePage('deals')}
          />

          <div className="nav-section">
            SYSTEM
          </div>

          <NavButton
            icon=""
            label="Settings"
            active={activePage === 'settings'}
            onClick={() => setActivePage('settings')}
          />

        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          Clerk authenticated
        </div>

      </aside>


      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="main-content">

        <header className="topbar">

          <div>
            <h1>
              {getPageTitle(activePage)}
            </h1>

            <p>
              {getPageSubtitle(activePage)}
            </p>
          </div>

          <div className="user-area">

            <div className="user-info">

              <strong>
                {name}
              </strong>

              <span>
                {email}
              </span>

            </div>

            <UserButton />

          </div>

        </header>

        {renderPage()}

      </main>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ name, onNavigate, apiFetch }) {
  const [stats, setStats] = useState({
    contacts: null,
    companies: null,
    deals: [],
    pipelines: [],
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard Data
  |--------------------------------------------------------------------------
  */

    const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        contactsResponse,
        companiesResponse,
        dealsResponse,
        stagesResponse,
      ] = await Promise.all([
        apiFetch(`${API_BASE}/api/contacts`),
        apiFetch(`${API_BASE}/api/companies`),
        apiFetch(`${API_BASE}/api/deals`),
        apiFetch(`${API_BASE}/api/deal-stages`),
      ]);

      if (!contactsResponse.ok) {
        throw new Error(
          `Contacts: HTTP ${contactsResponse.status}`
        );
      }

      if (!companiesResponse.ok) {
        throw new Error(
          `Companies: HTTP ${companiesResponse.status}`
        );
      }

      if (!dealsResponse.ok) {
        throw new Error(
          `Deals: HTTP ${dealsResponse.status}`
        );
      }

      if (!stagesResponse.ok) {
        throw new Error(
          `Deal stages: HTTP ${stagesResponse.status}`
        );
      }

      const readJsonResponse = async (
        response,
        label
      ) => {
        const text = await response.text();

        try {
          return JSON.parse(text);
        } catch {
          console.error(
            `[Dashboard] ${label} returned invalid JSON`,
            {
              status: response.status,
              contentType:
                response.headers.get(
                  'content-type'
                ),
              body: text.slice(0, 500),
            }
          );

          throw new Error(
            `${label}: Backend returned invalid JSON`
          );
        }
      };

      const [
        contactsData,
        companiesData,
        dealsData,
        stagesData,
      ] = await Promise.all([
        readJsonResponse(
          contactsResponse,
          'Contacts'
        ),
        readJsonResponse(
          companiesResponse,
          'Companies'
        ),
        readJsonResponse(
          dealsResponse,
          'Deals'
        ),
        readJsonResponse(
          stagesResponse,
          'Deal stages'
        ),
      ]);

      const contacts =
        extractArray(contactsData);

      const companies =
        extractArray(companiesData);

      const deals =
        extractArray(dealsData)
          .map(normalizeDeal);

      const stages =
        extractArray(stagesData)
          .map(normalizeStage)
          .sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0)
          );

      setStats({
        contacts: contacts.length,
        companies: companies.length,
        deals,
        pipelines: [
          {
            id: 'local',
            name: 'Sales Pipeline',
            label: 'Sales Pipeline',
            stages,
          },
        ],
      });
    } catch (err) {
      console.error(
        'Dashboard error:',
        err
      );

      setError(
        err.message ||
          'Unable to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadStats();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const getDealAmount = (deal) => {
    return Number(
      deal?.amount || 0
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(
      'ja-JP',
      {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  };

  const getStageInfo = (deal) => {
    const pipeline =
      stats.pipelines.find(
        (item) =>
          item.id ===
          deal.pipeline
      );

    if (!pipeline) {
      return null;
    }

    return (
      pipeline.stages?.find(
        (stage) =>
          stage.id ===
          deal.stage
      ) || null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Deal Statistics
  |--------------------------------------------------------------------------
  */

  const totalDeals =
    stats.deals.length;

  const totalPipeline =
    stats.deals.reduce(
      (total, deal) =>
        total +
        getDealAmount(deal),
      0
    );

  const openDeals =
    stats.deals.filter(
      (deal) => {
        const stage =
          getStageInfo(deal);

        return !(
          stage?.metadata
            ?.isClosed
        );
      }
    );

  const wonDeals =
    stats.deals.filter(
      (deal) => {
        const stage =
          getStageInfo(deal);

        return (
          stage?.metadata
            ?.isClosed === true &&
          stage?.metadata
            ?.isWon === true
        );
      }
    );

  const lostDeals =
    stats.deals.filter(
      (deal) => {
        const stage =
          getStageInfo(deal);

        return (
          stage?.metadata
            ?.isClosed === true &&
          stage?.metadata
            ?.isWon === false
        );
      }
    );

  const openValue =
    openDeals.reduce(
      (total, deal) =>
        total +
        getDealAmount(deal),
      0
    );

  const wonValue =
    wonDeals.reduce(
      (total, deal) =>
        total +
        getDealAmount(deal),
      0
    );

  const lostValue =
    lostDeals.reduce(
      (total, deal) =>
        total +
        getDealAmount(deal),
      0
    );

  const closedDeals =
    wonDeals.length +
    lostDeals.length;

  const winRate =
    closedDeals > 0
      ? (
          (wonDeals.length /
            closedDeals) *
          100
        ).toFixed(1)
      : '0.0';

  /*
  |--------------------------------------------------------------------------
  | Pipeline Stage Statistics
  |--------------------------------------------------------------------------
  */

  const selectedPipeline =
    stats.pipelines.find(
      (pipeline) =>
        pipeline.id ===
        stats.deals[0]?.pipeline
    );

  const stageStats =
    selectedPipeline?.stages
      ?.map((stage) => {
        const stageDeals =
          stats.deals.filter(
            (deal) =>
              deal.pipeline ===
                selectedPipeline.id &&
              deal.stage ===
                stage.id
          );

        const value =
          stageDeals.reduce(
            (total, deal) =>
              total +
              getDealAmount(
                deal
              ),
            0
          );

        return {
          ...stage,
          deals:
            stageDeals,
          count:
            stageDeals.length,
          value,
        };
      })
      .filter(
        (stage) =>
          stage.count > 0
      ) || [];

  /*
  |--------------------------------------------------------------------------
  | Recent Deals
  |--------------------------------------------------------------------------
  */

  const recentDeals = [
    ...stats.deals,
  ]
    .sort(
      (a, b) =>
        new Date(
          b.updatedAt ||
            b.createdAt ||
            0
        ) -
        new Date(
          a.updatedAt ||
            a.createdAt ||
            0
        )
    )
    .slice(0, 5);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section className="dashboard">

      {/* =====================================================
          WELCOME
      ===================================================== */}

      <div className="welcome-card">

        <div>

          <span className="eyebrow">
            AUTHENTICATED CRM
          </span>

          <h2>
            Welcome back, {name}
          </h2>

          <p>
            Your live sales workspace.
          </p>

        </div>

        <div className="connection-status">

          <span />

          CRM Connected

        </div>

      </div>


      {/* =====================================================
          REFRESH
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'flex-end',
          marginBottom: '18px',
        }}
      >

        <button
          className="secondary-button"
          onClick={loadStats}
          disabled={loading}
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh Dashboard'}
        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="system-card">

          <h2
            style={{
              color:
                '#ff6b6b',
            }}
          >
            Dashboard Error
          </h2>

          <p>
            {error}
          </p>

          <button
            className="primary-button"
            onClick={loadStats}
          >
            Retry
          </button>

        </div>

      )}


      {/* =====================================================
          MAIN KPI CARDS
      ===================================================== */}

      <div className="stats-grid">

        {/* CONTACTS */}

        <button
          className="stat-card stat-button"
          onClick={() =>
            onNavigate(
              'contacts'
            )
          }
        >

          <span>
            Contacts
          </span>

          <strong>
            {loading &&
            stats.contacts === null
              ? '—'
              : stats.contacts}
          </strong>

          <small>
            Live from CRM database
          </small>

        </button>


        {/* COMPANIES */}

        <button
          className="stat-card stat-button"
          onClick={() =>
            onNavigate(
              'companies'
            )
          }
        >

          <span>
            Companies
          </span>

          <strong>
            {loading &&
            stats.companies === null
              ? '—'
              : stats.companies}
          </strong>

          <small>
            Live from CRM database
          </small>

        </button>


        {/* OPEN DEALS */}

        <button
          className="stat-card stat-button"
          onClick={() =>
            onNavigate(
              'deals'
            )
          }
        >

          <span>
            Open Deals
          </span>

          <strong>
            {loading
              ? '—'
              : openDeals.length}
          </strong>

          <small>
            {formatCurrency(
              openValue
            )}
          </small>

        </button>


        {/* PIPELINE */}

        <div className="stat-card">

          <span>
            Pipeline
          </span>

          <strong>
            {loading
              ? '—'
              : formatCurrency(
                  totalPipeline
                )}
          </strong>

          <small>
            {totalDeals}{' '}
            total deals
          </small>

        </div>

      </div>


      {/* =====================================================
          SALES PERFORMANCE
      ===================================================== */}

      <div className="dashboard-performance-grid">

        <div className="dashboard-performance-card">

          <span>
            Won Revenue
          </span>

          <strong>
            {formatCurrency(
              wonValue
            )}
          </strong>

          <small>
            {wonDeals.length}{' '}
            won deals
          </small>

        </div>


        <div className="dashboard-performance-card">

          <span>
            Lost Revenue
          </span>

          <strong>
            {formatCurrency(
              lostValue
            )}
          </strong>

          <small>
            {lostDeals.length}{' '}
            lost deals
          </small>

        </div>


        <div className="dashboard-performance-card">

          <span>
            Win Rate
          </span>

          <strong>
            {winRate}%
          </strong>

          <small>
            {closedDeals}{' '}
            closed deals
          </small>

        </div>

      </div>


      {/* =====================================================
          SALES PIPELINE
      ===================================================== */}

      <div className="system-card">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              SALES PIPELINE
            </span>

            <h2>
              Pipeline Overview
            </h2>

            <p>
              Current deal distribution
              across your sales stages.
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={() =>
              onNavigate(
                'deals'
              )
            }
          >
            View Deals
          </button>

        </div>


        {stageStats.length === 0 ? (

          <div className="empty-state">
            No active pipeline
            data available.
          </div>

        ) : (

          <div className="dashboard-pipeline">

            {stageStats.map(
              (stage) => (

                <div
                  className="dashboard-stage"
                  key={stage.id}
                >

                  <div className="dashboard-stage-header">

                    <span>
                      ●{' '}
                      {stage.label ||
                        stage.name}
                    </span>

                    <strong>
                      {formatCurrency(
                        stage.value
                      )}
                    </strong>

                  </div>

                  <small>
                    {stage.count}{' '}
                    {stage.count === 1
                      ? 'deal'
                      : 'deals'}
                  </small>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* =====================================================
          RECENT DEALS
      ===================================================== */}

      <div className="system-card">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              SALES ACTIVITY
            </span>

            <h2>
              Recent Deals
            </h2>

            <p>
              Latest opportunities
              from your CRM database.
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={() =>
              onNavigate(
                'deals'
              )
            }
          >
            View All
          </button>

        </div>


        {recentDeals.length === 0 ? (

          <div className="empty-state">
            No deals found.
          </div>

        ) : (

          <div className="recent-deals-list">

            {recentDeals.map(
              (deal) => {

                const contact =
                  deal.contacts?.[0];

                const company =
                  deal.companies?.[0];

                const stageInfo =
                  getStageInfo(
                    deal
                  );

                return (

                  <div
                    className="recent-deal-row"
                    key={deal.id}
                  >

                    <div>

                      <strong>
                        {deal.name ||
                          'Unnamed Deal'}
                      </strong>

                      <small>
                        {contact
                          ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : 'No contact'}
                      </small>

                    </div>


                    <div>

                      <span>
                        {company?.name ||
                          'No company'}
                      </span>

                    </div>


                    <div>

                      <strong>
                        {formatCurrency(
                          getDealAmount(
                            deal
                          )
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        {stageInfo?.label ||
                          stageInfo?.name ||
                          deal.stage ||
                          'Unknown'}
                      </span>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>


     

      {/* =====================================================
          SYSTEM STATUS
      ===================================================== */}

      <div className="system-card">

        <h2>
          System Status
        </h2>

        <StatusRow
          name="Clerk Authentication"
          status="Connected"
        />

        <StatusRow
          name="CRM Dashboard"
          status="Operational"
        />

        <StatusRow
          name="CRM Database"
          status={
            loading
              ? 'Checking...'
              : 'Connected'
          }
        />

        <StatusRow
          name="Backend API"
          status={
            error
              ? 'Partial'
              : loading
                ? 'Checking...'
                : 'Connected'
          }
        />

      </div>

    </section>
  );
}



/* =========================================================
   CONTACTS
========================================================= */



function ContactsPage({ apiFetch }) {

  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const loadContacts = async () => {

    try {

      setLoading(true);
      setError('');

      const response = await apiFetch(
        `${API_BASE}/api/contacts`
      );

      const text =
        await response.text();

      let data;

      try {

        data = JSON.parse(text);

      } catch {

        throw new Error(
          'Backend returned invalid JSON'
        );

      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load contacts'
        );
      }

      setContacts(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Unable to load contacts'
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (

    <section className="dashboard">

      <div className="welcome-card">

        <div>

          <span className="eyebrow">
            CRM DATABASE
          </span>

          <h2>
            Contacts
          </h2>

          <p>
            Contacts retrieved from the CRM database.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={loadContacts}
        >
          Refresh
        </button>

      </div>

      {error && (

        <div className="system-card">

          <h2 style={{ color: '#ff6b6b' }}>
            Unable to load contacts
          </h2>

          <p>{error}</p>

        </div>

      )}

      <div className="system-card">

        <div className="section-heading">

          <div>
            <h2>
              CRM Contacts
            </h2>

            <p>
              {loading
                ? 'Loading...'
                : `${contacts.length} contacts`}
            </p>
          </div>

        </div>

        {!loading && contacts.length === 0 && (

          <div className="empty-state">
            No contacts found.
          </div>

        )}

        {!loading && contacts.length > 0 && (

          <div className="deals-table-wrapper">

            <table className="deals-table">

              <thead>

                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>CRM ID</th>
                </tr>

              </thead>

              <tbody>

                {contacts.map((contact) => {

                  const p =
                    contact.properties || {};

                  const fullName =
                    [
                      p.firstname,
                      p.lastname,
                    ]
                      .filter(Boolean)
                      .join(' ') ||
                    'Unnamed Contact';

                  return (

                    <tr key={contact.id}>

                      <td>
                        <strong>
                          {fullName}
                        </strong>
                      </td>

                      <td>
                        {p.email || '—'}
                      </td>

                      <td>
                        {p.phone || '—'}
                      </td>

                      <td>
                        {p.company || '—'}
                      </td>

                      <td>
                        {contact.id}
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>

  );
}


/* =========================================================
   COMPANIES
========================================================= */

function CompaniesPage({ apiFetch }) {

  const [companies, setCompanies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadCompanies = async () => {

    try {

      setLoading(true);
      setError('');

      const response = await apiFetch(
        `${API_BASE}/api/companies`
      );

      const text =
        await response.text();

      let data;

      try {

        data = JSON.parse(text);

      } catch {

        throw new Error(
          'Backend returned invalid JSON'
        );

      }

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
          : Array.isArray(data?.results)
            ? data.results
            : []
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Unable to load companies'
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    loadCompanies();
  }, []);

  return (

    <section className="dashboard">

      <div className="welcome-card">

        <div>

          <span className="eyebrow">
            CRM DATABASE
          </span>

          <h2>
            Companies
          </h2>

          <p>
            Companies retrieved from the CRM database.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={loadCompanies}
        >
          Refresh
        </button>

      </div>

      {error && (

        <div className="system-card">

          <h2 style={{ color: '#ff6b6b' }}>
            Unable to load companies
          </h2>

          <p>{error}</p>

        </div>

      )}

      <div className="system-card">

        <div className="section-heading">

          <div>

            <h2>
              CRM Companies
            </h2>

            <p>
              {loading
                ? 'Loading...'
                : `${companies.length} companies`}
            </p>

          </div>

        </div>

        {!loading && companies.length === 0 && (

          <div className="empty-state">
            No companies found.
          </div>

        )}

        {!loading && companies.length > 0 && (

          <div className="deals-table-wrapper">

            <table className="deals-table">

              <thead>

                <tr>
                  <th>Company</th>
                  <th>Domain</th>
                  <th>Industry</th>
                  <th>City</th>
                  <th>CRM ID</th>
                </tr>

              </thead>

              <tbody>

                {companies.map((company) => {

                  const p =
                    company.properties || {};

                  return (

                    <tr key={company.id}>

                      <td>
                        <strong>
                          {p.name ||
                            'Unnamed Company'}
                        </strong>
                      </td>

                      <td>
                        {p.domain || '—'}
                      </td>

                      <td>
                        {p.industry || '—'}
                      </td>

                      <td>
                        {p.city || '—'}
                      </td>

                      <td>
                        {company.id}
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>

  );
}


/* =========================================================
   SIMPLE PAGE
========================================================= */

function SimplePage({ title, subtitle }) {

  return (

    <section className="dashboard">

      <div className="welcome-card">

        <div>

          <span className="eyebrow">
            ICHIKAWA SOLUTIONS LTD.
          </span>

          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>

        </div>

      </div>

      <div className="system-card">

        <h2>
          {title}
        </h2>

        <p>
          This section is ready for configuration.
        </p>

      </div>

    </section>

  );
}


/* =========================================================
   NAV BUTTON
========================================================= */

function NavButton({
  icon,
  label,
  active,
  onClick,
}) {

  return (

    <button
      className={
        active
          ? 'nav-item active'
          : 'nav-item'
      }
      onClick={onClick}
    >

      <span>
        {icon}
      </span>

      {label}

    </button>

  );
}


/* =========================================================
   STATUS ROW
========================================================= */

function StatusRow({ name, status }) {

  const connected =
    status === 'Connected' ||
    status === 'Operational';

  return (

    <div className="status-row">

      <span>
        {name}
      </span>

      <div
        className={
          connected
            ? 'status connected'
            : 'status'
        }
      >

        <span />

        {status}

      </div>

    </div>

  );
}


/* =========================================================
   PAGE TITLES
========================================================= */

function getPageTitle(page) {

  const titles = {
    dashboard: 'Dashboard',
    contacts: 'Contacts',
    companies: 'Companies',
    deals: 'Deals',
    settings: 'Settings',
  };

  return titles[page] || 'Dashboard';
}


function getPageSubtitle(page) {

  const subtitles = {
    dashboard:
      'Customer, sales & support overview',

    contacts:
      'CRM contacts',

    companies:
      'CRM companies',

    deals:
      'Sales opportunities and customer purchases',

    settings:
      'CRM configuration and preferences',
  };

  return (
    subtitles[page] ||
    'Customer, sales & support overview'
  );
}

export default App;