import { useEffect, useMemo, useState } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/react';
import Deals from './Deals';
import './App.css';

const API_BASE = 'http://localhost:5000';

const NAV = [
  { section: 'MAIN', items: [
    { id: 'dashboard', icon: '▦', label: 'Overview' },
  ]},
  { section: 'SALES', items: [
    { id: 'contacts', icon: '○', label: 'Contacts' },
    { id: 'companies', icon: '◇', label: 'Companies' },
    { id: 'deals', icon: '◆', label: 'Deals' },
  ]},
  { section: 'SUPPORT', items: [
    { id: 'tickets', icon: '◌', label: 'Tickets' },
  ]},
  { section: 'SYSTEM', items: [
    { id: 'hubspot', icon: '⬡', label: 'HubSpot' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ]},
];

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [activePage, setActivePage] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  if (!isLoaded) {
    return <div className="app-loading">Loading CRM...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <div className="auth-mark">◆</div>
          <div className="auth-copy">
            <span>ICHIKAWA SOLUTIONS LTD.</span>
            <h1>Sales CRM</h1>
            <p>Please sign in to continue to your workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || 'No email';
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'User';

  const renderPage = () => {
    switch (activePage) {
      case 'contacts': return <ContactsPage search={globalSearch} />;
      case 'companies': return <CompaniesPage search={globalSearch} />;
      case 'deals': return <Deals />;
      case 'tickets': return <SimplePage title="Tickets" subtitle="Support tickets and customer requests" />;
      case 'hubspot': return <SimplePage title="HubSpot" subtitle="HubSpot CRM integration" />;
      case 'settings': return <SimplePage title="Settings" subtitle="CRM configuration and preferences" />;
      default: return <Dashboard name={name} onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="crm-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">◆</div>
          <div className="brand-copy">
            <strong>ICHIKAWA</strong>
            <span>SALES CRM</span>
          </div>
        </div>

        <div className="workspace-pill">
          <span className="workspace-dot" />
          <div>
            <strong>Manager</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav className="navigation">
          {NAV.map((group) => (
            <div className="nav-group" key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map((item) => (
                <NavButton
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activePage === item.id}
                  onClick={() => setActivePage(item.id)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <div>
            <strong>System online</strong>
            <span>HubSpot connected</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>CRM</span>
            <b>›</b>
            <strong>{getPageTitle(activePage)}</strong>
          </div>

          <div className="topbar-actions">
            <label className="global-search">
              <span>⌕</span>
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search contacts, companies..."
              />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" type="button" aria-label="Notifications">♢</button>
            <div className="user-area">
              <div className="user-info">
                <strong>{name}</strong>
                <span>{email}</span>
              </div>
              <UserButton />
            </div>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}

function Dashboard({ name, onNavigate }) {
  const [stats, setStats] = useState({ contacts: null, companies: null, deals: null, pipeline: null, won: null, open: null });
  const [recentDeals, setRecentDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    const failures = [];

    try {
      const [contactsRes, companiesRes, dealsRes] = await Promise.all([
        fetch(`${API_BASE}/api/hubspot/contacts`),
        fetch(`${API_BASE}/api/hubspot/companies`),
        fetch(`${API_BASE}/api/hubspot/deals-with-contacts`),
      ]);

      if (!contactsRes.ok) failures.push('contacts');
      if (!companiesRes.ok) failures.push('companies');
      if (!dealsRes.ok) failures.push('deals');

      const contacts = contactsRes.ok ? await contactsRes.json() : { results: [] };
      const companies = companiesRes.ok ? await companiesRes.json() : { results: [] };
      const deals = dealsRes.ok ? await dealsRes.json() : { results: [] };
      const results = Array.isArray(deals.results) ? deals.results : [];

      const won = results.filter((deal) => /won|closedwon/i.test(deal.stage || '')).reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
      const open = results.filter((deal) => !/won|lost|closed/i.test(deal.stage || '')).length;
      const pipeline = results.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);

      setStats({
        contacts: Array.isArray(contacts.results) ? contacts.results.length : 0,
        companies: Array.isArray(companies.results) ? companies.results.length : 0,
        deals: results.length,
        pipeline,
        won,
        open,
      });
      setRecentDeals(results.slice(0, 5));

      if (failures.length) setError(`Unable to load: ${failures.join(', ')}`);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const money = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(Number(value || 0));

  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="page dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Good to see you, {name.split(' ')[0]}</h1>
          <p>Monitor your sales pipeline and customer activity at a glance.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={loadStats}>Refresh</button>
          <button className="primary-button" onClick={() => onNavigate('deals')}>View pipeline</button>
        </div>
      </div>

      {error && (
        <div className="alert-card">
          <div><strong>Some data could not be loaded</strong><span>{error}</span></div>
          <button className="secondary-button" onClick={loadStats}>Retry</button>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard label="Pipeline value" value={loading ? '—' : money(stats.pipeline)} meta="Total active deal value" accent />
        <KpiCard label="Open deals" value={loading ? '—' : stats.open} meta="Sales opportunities" />
        <KpiCard label="Won revenue" value={loading ? '—' : money(stats.won)} meta="Closed won deals" positive />
        <KpiCard label="Customers" value={loading ? '—' : stats.contacts} meta={`${stats.companies ?? '—'} companies`} />
      </div>

      <div className="dashboard-grid">
        <section className="panel pipeline-panel">
          <PanelHeading title="Sales pipeline" subtitle="Current opportunity distribution" action="View deals" onAction={() => onNavigate('deals')} />
          <PipelineSnapshot deals={recentDeals} money={money} />
        </section>

        <section className="panel activity-panel">
          <PanelHeading title="Workspace" subtitle="Your CRM at a glance" />
          <div className="workspace-stats">
            <MetricRow label="Contacts" value={loading ? '—' : stats.contacts} onClick={() => onNavigate('contacts')} />
            <MetricRow label="Companies" value={loading ? '—' : stats.companies} onClick={() => onNavigate('companies')} />
            <MetricRow label="Deals" value={loading ? '—' : stats.deals} onClick={() => onNavigate('deals')} />
            <MetricRow label="HubSpot" value="Connected" status />
          </div>
          <div className="manager-card">
            <div className="avatar">{initials}</div>
            <div><strong>{name}</strong><span>CRM Manager</span></div>
            <span className="live-badge">LIVE</span>
          </div>
        </section>
      </div>

      <section className="panel recent-panel">
        <PanelHeading title="Recent deals" subtitle="Latest opportunities from HubSpot" action="Open deals" onAction={() => onNavigate('deals')} />
        {recentDeals.length === 0 && !loading ? (
          <div className="empty-state">No deals found.</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Deal</th><th>Contact</th><th>Company</th><th>Amount</th><th>Stage</th></tr></thead>
              <tbody>
                {recentDeals.map((deal) => {
                  const contact = deal.contacts?.[0];
                  const company = deal.companies?.[0];
                  return (
                    <tr key={deal.id}>
                      <td><strong>{deal.name}</strong><span className="table-sub">#{deal.id}</span></td>
                      <td>{contact ? `${contact.firstName} ${contact.lastName}`.trim() : '—'}</td>
                      <td>{company?.name || contact?.company || '—'}</td>
                      <td className="money-cell">{money(deal.amount)}</td>
                      <td><span className="stage-badge">{formatStage(deal.stage)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function KpiCard({ label, value, meta, accent, positive }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top"><span>{label}</span><button type="button">•••</button></div>
      <strong className={accent ? 'accent-text' : ''}>{value}</strong>
      <small className={positive ? 'positive-text' : ''}>{meta}</small>
    </div>
  );
}

function PipelineSnapshot({ deals, money }) {
  const stages = useMemo(() => {
    const map = new Map();
    deals.forEach((deal) => {
      const key = formatStage(deal.stage);
      const current = map.get(key) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(deal.amount || 0);
      map.set(key, current);
    });
    return Array.from(map.entries()).slice(0, 5);
  }, [deals]);

  if (!stages.length) return <div className="empty-state compact">Pipeline data will appear here.</div>;

  return (
    <div className="snapshot-list">
      {stages.map(([stage, data]) => (
        <div className="snapshot-row" key={stage}>
          <div className="snapshot-label"><span className="stage-dot" /><strong>{stage}</strong><small>{data.count} deal{data.count === 1 ? '' : 's'}</small></div>
          <strong>{money(data.amount)}</strong>
        </div>
      ))}
    </div>
  );
}

function PanelHeading({ title, subtitle, action, onAction }) {
  return (
    <div className="panel-heading">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      {action && <button className="text-button" onClick={onAction}>{action} →</button>}
    </div>
  );
}

function MetricRow({ label, value, onClick, status }) {
  return (
    <button className="metric-row" onClick={onClick} disabled={!onClick}>
      <span>{label}</span>
      <strong className={status ? 'connected-text' : ''}>{status && <i />} {value}</strong>
    </button>
  );
}

function ContactsPage({ search }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContacts = async () => {
    try {
      setLoading(true); setError('');
      const response = await fetch(`${API_BASE}/api/hubspot/contacts`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to load contacts');
      setContacts(Array.isArray(data?.results) ? data.results : []);
    } catch (err) { setError(err.message || 'Unable to load contacts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadContacts(); }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => JSON.stringify(contact.properties || {}).toLowerCase().includes(query));
  }, [contacts, search]);

  return (
    <section className="page">
      <PageHeading eyebrow="SALES" title="Contacts" subtitle="People connected to your sales activity." action={<button className="secondary-button" onClick={loadContacts}>Refresh</button>} />
      {error && <InlineError message={error} onRetry={loadContacts} />}
      <section className="panel table-panel">
        <PanelHeading title="All contacts" subtitle={loading ? 'Loading contacts...' : `${filtered.length} contacts`} />
        {loading ? <TableLoading /> : filtered.length === 0 ? <div className="empty-state">No contacts found.</div> : (
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Contact</th><th>Email</th><th>Phone</th><th>Company</th><th>Role</th></tr></thead><tbody>
            {filtered.map((contact) => {
              const p = contact.properties || {};
              const name = [p.firstname, p.lastname].filter(Boolean).join(' ') || 'Unnamed Contact';
              return <tr key={contact.id}><td><div className="person-cell"><div className="avatar small">{name[0]}</div><div><strong>{name}</strong><span className="table-sub">#{contact.id}</span></div></div></td><td>{p.email || '—'}</td><td>{p.phone || '—'}</td><td>{p.company || '—'}</td><td>{p.jobtitle || '—'}</td></tr>;
            })}
          </tbody></table></div>
        )}
      </section>
    </section>
  );
}

function CompaniesPage({ search }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCompanies = async () => {
    try {
      setLoading(true); setError('');
      const response = await fetch(`${API_BASE}/api/hubspot/companies`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to load companies');
      setCompanies(Array.isArray(data?.results) ? data.results : []);
    } catch (err) { setError(err.message || 'Unable to load companies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCompanies(); }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter((company) => JSON.stringify(company.properties || {}).toLowerCase().includes(query));
  }, [companies, search]);

  return (
    <section className="page">
      <PageHeading eyebrow="SALES" title="Companies" subtitle="Organizations connected to your CRM." action={<button className="secondary-button" onClick={loadCompanies}>Refresh</button>} />
      {error && <InlineError message={error} onRetry={loadCompanies} />}
      <section className="panel table-panel">
        <PanelHeading title="All companies" subtitle={loading ? 'Loading companies...' : `${filtered.length} companies`} />
        {loading ? <TableLoading /> : filtered.length === 0 ? <div className="empty-state">No companies found.</div> : (
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Company</th><th>Domain</th><th>Industry</th><th>Location</th><th>Phone</th></tr></thead><tbody>
            {filtered.map((company) => {
              const p = company.properties || {};
              return <tr key={company.id}><td><strong>{p.name || 'Unnamed Company'}</strong><span className="table-sub">#{company.id}</span></td><td>{p.domain || '—'}</td><td>{p.industry || '—'}</td><td>{[p.city, p.state, p.country].filter(Boolean).join(', ') || '—'}</td><td>{p.phone || '—'}</td></tr>;
            })}
          </tbody></table></div>
        )}
      </section>
    </section>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="heading-actions">{action}</div>}</div>;
}

function InlineError({ message, onRetry }) {
  return <div className="alert-card"><div><strong>Unable to load data</strong><span>{message}</span></div><button className="secondary-button" onClick={onRetry}>Retry</button></div>;
}

function TableLoading() {
  return <div className="table-loading"><span /><span /><span /><span /></div>;
}

function SimplePage({ title, subtitle }) {
  return <section className="page"><PageHeading eyebrow="SYSTEM" title={title} subtitle={subtitle} /><section className="panel empty-panel"><div className="empty-icon">◇</div><h2>{title}</h2><p>This workspace is ready for configuration.</p></section></section>;
}

function NavButton({ icon, label, active, onClick }) {
  return <button className={`nav-item${active ? ' active' : ''}`} onClick={onClick}><span className="nav-icon">{icon}</span><span className="nav-label">{label}</span></button>;
}

function getPageTitle(page) {
  return { dashboard: 'Overview', contacts: 'Contacts', companies: 'Companies', deals: 'Deals', tickets: 'Tickets', hubspot: 'HubSpot', settings: 'Settings' }[page] || 'Overview';
}

function formatStage(stage) {
  if (!stage) return 'Unknown';
  return String(stage).replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default App;
