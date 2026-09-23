import { useEffect, useMemo, useState } from 'react';
import CreateDeal from './CreateDeal';
import './Deals.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/* =====================================================
   HELPERS
===================================================== */

function formatCurrency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return 'No close date';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No close date';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDealName(deal) {
  return deal?.title || 'Unnamed Deal';
}

function getDealAmount(deal) {
  return deal?.amount ?? 0;
}

function getDealStage(deal) {
  return deal?.stageId || '';
}

/* =====================================================
   DEAL CARD
===================================================== */

function DealCard({
  deal,
  onDragStart,
  onClick,
}) {
  const contact = deal?.contact;
  const company = deal?.company;

  const closeDate =
    deal?.closeDate ||
    deal?.closedAt ||
    null;

  const contactName = [
    contact?.firstName,
    contact?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const initials = (
    contact?.firstName?.[0] ||
    contact?.lastName?.[0] ||
    '?'
  ).toUpperCase();

  return (
    <div
      className="pipeline-deal-card"
      draggable
      onDragStart={(event) => {
        onDragStart(event, deal);
      }}
      onClick={() => onClick(deal)}
    >
      <div className="pipeline-deal-top">
        <span className="deal-id">
          #{deal.id}
        </span>

        <span className="deal-menu">
          •••
        </span>
      </div>

      <h3>
        {getDealName(deal)}
      </h3>

      <div className="deal-card-amount">
        {formatCurrency(
          getDealAmount(deal),
          deal?.currency || 'JPY'
        )}
      </div>

      {contact && (
        <div className="deal-card-person">
          <div className="deal-avatar">
            {initials}
          </div>

          <div>
            <strong>
              {contactName || 'Unknown contact'}
            </strong>

            <span>
              {contact.email || 'No email'}
            </span>
          </div>
        </div>
      )}

      {company && (
        <div className="deal-card-company">
          <span>
            Company
          </span>

          <strong>
            {company.name || 'Unnamed company'}
          </strong>
        </div>
      )}

      <div className="deal-card-footer">
        <span>
          Close date
        </span>

        <strong>
          {formatDate(closeDate)}
        </strong>
      </div>
    </div>
  );
}

/* =====================================================
   DEALS PAGE
===================================================== */

function Deals({ apiFetch }) {
  const [deals, setDeals] = useState([]);

  const [clientRole, setClientRole] =
    useState(null);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [dealSearch, setDealSearch] =
    useState('');

  const [stageFilter, setStageFilter] =
    useState('all');

  const [companyFilter, setCompanyFilter] =
    useState('all');

  const [amountFilter, setAmountFilter] =
    useState('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [stages, setStages] =
    useState([]);

  const [movingDeal, setMovingDeal] =
    useState(null);

  const [selectedDeal, setSelectedDeal] =
    useState(null);

  const [showCreateDeal, setShowCreateDeal] =
    useState(false);

      /* =====================================================
     CHECK CRM ACCESS / ROLE
  ===================================================== */

  const loadAccess = async () => {
    try {
      const response = await apiFetch(
        `${API_BASE}/api/access/me`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Unable to verify CRM access'
        );
      }

      const memberships =
        Array.isArray(data?.memberships)
          ? data.memberships
          : [];

      const clientMembership =
        memberships.find(
          (membership) =>
            membership.organization?.type ===
            'CLIENT'
        );

      setClientRole(
        clientMembership?.role || null
      );
    } catch (err) {
      console.error(
        'CRM access check error:',
        err
      );

      setClientRole(null);
    } finally {
      setCheckingAccess(false);
    }
  };
  /* =====================================================
     LOAD STAGES
  ===================================================== */

  const loadStages = async () => {
    try {
      const response = await apiFetch(
        `${API_BASE}/api/deal-stages`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load deal stages'
        );
      }

      setStages(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        'Deal stages error:',
        err
      );

      setError(
        err.message ||
        'Unable to load deal stages'
      );
    }
  };

  /* =====================================================
     LOAD DEALS
  ===================================================== */

  const loadDeals = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiFetch(
        `${API_BASE}/api/deals`
      );

     const data =
  await response.json();

console.log('[DEALS API]', {
  status: response.status,
  data,
  isArray: Array.isArray(data),
});

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load deals'
        );
      }

      setDeals(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        'Deals error:',
        err
      );

      setError(
        err.message ||
        'Unable to load deals'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadAccess();
    loadStages();
    loadDeals();
  }, []);
  const isClient =
    clientRole === 'CLIENT_ADMIN' ||
    clientRole === 'CLIENT_MEMBER' ||
    clientRole === 'CLIENT_VIEWER';
  /* =====================================================
     ALL LOCAL DEALS
  ===================================================== */

  const pipelineDeals = deals;

  /* =====================================================
     FILTER DEALS
  ===================================================== */

  const filteredDeals = useMemo(() => {
    return pipelineDeals.filter((deal) => {
      const search =
        dealSearch
          .trim()
          .toLowerCase();

      const dealName =
        getDealName(deal)
          .toLowerCase();

      const dealId =
        String(deal.id || '')
          .toLowerCase();

      const contactText = [
        deal.contact?.firstName || '',
        deal.contact?.lastName || '',
        deal.contact?.email || '',
        deal.contact?.phone || '',
        deal.contact?.jobTitle || '',
      ]
        .join(' ')
        .toLowerCase();

      const companyText = [
        deal.company?.name || '',
        deal.company?.industry || '',
        deal.company?.email || '',
        deal.company?.phone || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search ||
        dealName.includes(search) ||
        dealId.includes(search) ||
        contactText.includes(search) ||
        companyText.includes(search);

      const matchesStage =
        stageFilter === 'all' ||
        deal.stageId === stageFilter;

      const companyName =
        deal.company?.name || '';

      const matchesCompany =
        companyFilter === 'all' ||
        companyName === companyFilter;

      const amount =
        Number(
          getDealAmount(deal)
        ) || 0;

      const matchesAmount =
        amountFilter === 'all' ||
        (
          amountFilter === 'under100k' &&
          amount < 100000
        ) ||
        (
          amountFilter === '100k500k' &&
          amount >= 100000 &&
          amount < 500000
        ) ||
        (
          amountFilter === '500k1m' &&
          amount >= 500000 &&
          amount < 1000000
        ) ||
        (
          amountFilter === 'over1m' &&
          amount >= 1000000
        );

      return (
        matchesSearch &&
        matchesStage &&
        matchesCompany &&
        matchesAmount
      );
    });
  }, [
    pipelineDeals,
    dealSearch,
    stageFilter,
    companyFilter,
    amountFilter,
  ]);

  /* =====================================================
     PIPELINE TOTAL
  ===================================================== */

  const totalPipelineValue =
    pipelineDeals.reduce(
      (total, deal) =>
        total +
        (
          Number(
            getDealAmount(deal)
          ) || 0
        ),
      0
    );

  /* =====================================================
     OPEN / WON / LOST
  ===================================================== */

  const openDeals =
    pipelineDeals.filter((deal) => {
      const stage =
        deal?.stage?.name
          ?.toLowerCase() || '';

      return (
        !stage.includes('won') &&
        !stage.includes('lost')
      );
    });

  const wonDeals =
    pipelineDeals.filter((deal) => {
      const stage =
        deal?.stage?.name
          ?.toLowerCase() || '';

      return stage.includes('won');
    });

  const lostDeals =
    pipelineDeals.filter((deal) => {
      const stage =
        deal?.stage?.name
          ?.toLowerCase() || '';

      return stage.includes('lost');
    });

  const wonValue =
    wonDeals.reduce(
      (total, deal) =>
        total +
        (
          Number(
            getDealAmount(deal)
          ) || 0
        ),
      0
    );

  const lostValue =
    lostDeals.reduce(
      (total, deal) =>
        total +
        (
          Number(
            getDealAmount(deal)
          ) || 0
        ),
      0
    );

  const winRate =
    wonDeals.length +
      lostDeals.length >
    0
      ? (
          (
            wonDeals.length /
            (
              wonDeals.length +
              lostDeals.length
            )
          ) * 100
        ).toFixed(1)
      : '0.0';

  /* =====================================================
     DRAG START
  ===================================================== */

  const handleDragStart = (
    event,
    deal
  ) => {
    setMovingDeal(deal);

    event.dataTransfer.effectAllowed =
      'move';

    event.dataTransfer.setData(
      'text/plain',
      deal.id
    );
  };

  /* =====================================================
     DRAG OVER
  ===================================================== */

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect =
      'move';
  };

  /* =====================================================
     DROP
  ===================================================== */

  const handleDrop = async (
    event,
    stage
  ) => {
    event.preventDefault();

    if (!movingDeal) {
      return;
    }

    const oldStage =
      getDealStage(movingDeal);

    if (oldStage === stage.id) {
      setMovingDeal(null);
      return;
    }

    try {
      setError('');

      const response =
        await apiFetch(
          `${API_BASE}/api/deals/${movingDeal.id}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              title:
                movingDeal.title,

              description:
                movingDeal.description,

              companyId:
                movingDeal.companyId,

              contactId:
                movingDeal.contactId,

              stageId:
                stage.id,

              ownerId:
                movingDeal.ownerId,

              amount:
                movingDeal.amount,

              currency:
                movingDeal.currency,

              status:
                movingDeal.status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to update deal stage'
        );
      }

      await loadDeals();
    } catch (err) {
      console.error(
        'Deal stage update error:',
        err
      );

      setError(
        err.message ||
        'Unable to update deal stage'
      );

      await loadDeals();
    } finally {
      setMovingDeal(null);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <section className="dashboard deals-page">
        <div className="system-card">
          <span className="eyebrow">
            CRM
          </span>

          <h2>
            Loading Deals...
          </h2>

          <p>
            Retrieving deals, companies,
            contacts and stages from the
            local database.
          </p>
        </div>
      </section>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <section className="dashboard deals-page">

      {/* HEADER */}

      <div className="welcome-card">
        <div>
          <span className="eyebrow">
            SALES PIPELINE
          </span>

          <h2>
            Deals
          </h2>

          <p>
            Track every sales opportunity
            through its current stage.
          </p>
        </div>

        <div className="deals-header-actions">

          <button
            className="primary-button"
            onClick={() =>
              setShowCreateDeal(true)
            }
          >
            + Create Deal
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              loadStages();
              loadDeals();
            }}
          >
            Refresh
          </button>

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="system-card">
          <h3
            style={{
              color: '#ff7070',
            }}
          >
            Deal Error
          </h3>

          <p>
            {error}
          </p>

          <button
            className="secondary-button"
            onClick={() => {
              setError('');
              loadStages();
              loadDeals();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* FILTERS */}

      <div className="deal-filter-bar">

        <div className="deal-search-wrapper">
          <span className="deal-search-icon">
            🔍
          </span>

          <input
            type="text"
            className="deal-search-input"
            placeholder="Search deals, contacts, companies..."
            value={dealSearch}
            onChange={(event) =>
              setDealSearch(
                event.target.value
              )
            }
          />
        </div>

        <select
          className="deal-filter-select"
          value={stageFilter}
          onChange={(event) =>
            setStageFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All stages
          </option>

          {stages.map((stage) => (
            <option
              key={stage.id}
              value={stage.id}
            >
              {stage.name}
            </option>
          ))}
        </select>

        <select
          className="deal-filter-select"
          value={companyFilter}
          onChange={(event) =>
            setCompanyFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All companies
          </option>

          {[
            ...new Set(
              pipelineDeals
                .map(
                  (deal) =>
                    deal.company?.name
                )
                .filter(Boolean)
            ),
          ].map((company) => (
            <option
              key={company}
              value={company}
            >
              {company}
            </option>
          ))}
        </select>

        <select
          className="deal-filter-select"
          value={amountFilter}
          onChange={(event) =>
            setAmountFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All amounts
          </option>

          <option value="under100k">
            Under ₹100K
          </option>

          <option value="100k500k">
            ₹100K – ₹500K
          </option>

          <option value="500k1m">
            ₹500K – ₹1M
          </option>

          <option value="over1m">
            Over ₹1M
          </option>
        </select>

        {(dealSearch ||
          stageFilter !== 'all' ||
          companyFilter !== 'all' ||
          amountFilter !== 'all') && (
          <button
            type="button"
            className="clear-filter-button"
            onClick={() => {
              setDealSearch('');
              setStageFilter('all');
              setCompanyFilter('all');
              setAmountFilter('all');
            }}
          >
            Clear
          </button>
        )}

      </div>

      {/* SUMMARY */}

      <div className="pipeline-summary">

        <div className="pipeline-summary-card">
          <span>
            Pipeline Value
          </span>

          <strong>
            {formatCurrency(
              totalPipelineValue
            )}
          </strong>

          <small>
            {pipelineDeals.length}{' '}
            total deals
          </small>
        </div>

        <div className="pipeline-summary-card">
          <span>
            Open Deals
          </span>

          <strong>
            {openDeals.length}
          </strong>

          <small>
            {formatCurrency(
              openDeals.reduce(
                (total, deal) =>
                  total +
                  (
                    Number(
                      getDealAmount(deal)
                    ) || 0
                  ),
                0
              )
            )}
          </small>
        </div>

        <div className="pipeline-summary-card">
          <span>
            Won
          </span>

          <strong>
            {wonDeals.length}
          </strong>

          <small>
            {formatCurrency(
              wonValue
            )}
          </small>
        </div>

        <div className="pipeline-summary-card">
          <span>
            Lost
          </span>

          <strong>
            {lostDeals.length}
          </strong>

          <small>
            {formatCurrency(
              lostValue
            )}
          </small>
        </div>

        <div className="pipeline-summary-card">
          <span>
            Win Rate
          </span>

          <strong>
            {winRate}%
          </strong>

          <small>
            Based on closed deals
          </small>
        </div>

      </div>

      {/* PIPELINE BOARD */}

      <div className="pipeline-board">

        {stages.map((stage) => {

          const stageDeals =
            filteredDeals.filter(
              (deal) =>
                getDealStage(deal) ===
                stage.id
            );

          const stageValue =
            stageDeals.reduce(
              (total, deal) =>
                total +
                (
                  Number(
                    getDealAmount(deal)
                  ) || 0
                ),
              0
            );

          return (
            <div
              className="pipeline-column"
              key={stage.id}
              onDragOver={
                handleDragOver
              }
              onDrop={(event) =>
                handleDrop(
                  event,
                  stage
                )
              }
            >

              {/* COLUMN HEADER */}

              <div className="pipeline-column-header">

                <div>

                  <div className="pipeline-stage-title">

                    <span className="stage-dot" />

                    <strong>
                      {stage.name}
                    </strong>

                  </div>

                  <span className="pipeline-stage-count">
                    {stageDeals.length}{' '}
                    {stageDeals.length === 1
                      ? 'deal'
                      : 'deals'}
                  </span>

                </div>

                <strong className="pipeline-stage-value">
                  {formatCurrency(
                    stageValue
                  )}
                </strong>

              </div>

              {/* DEALS */}

              <div className="pipeline-column-body">

                {stageDeals.map(
                  (deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onDragStart={
                        handleDragStart
                      }
                      onClick={
                        setSelectedDeal
                      }
                    />
                  )
                )}
                {stageDeals.length === 0 && (
                  <div className="pipeline-empty">
                    Drop a deal here
                  </div>
                )}

              </div>

            </div>
          );
        })}

      </div>

      {/* DEAL DETAILS */}

      {selectedDeal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedDeal(null)
          }
        >

          <div
            className="deal-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  DEAL
                </span>

                <h2>
                  {getDealName(
                    selectedDeal
                  )}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedDeal(null)
                }
              >
                ×
              </button>

            </div>

            <div className="deal-detail-grid">

              <div>
                <span>
                  Amount
                </span>

                <strong>
                  {formatCurrency(
                    getDealAmount(
                      selectedDeal
                    ),
                    selectedDeal?.currency ||
                      'JPY'
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Stage
                </span>

                <strong>
                  {
                    stages.find(
                      (stage) =>
                        stage.id ===
                        getDealStage(
                          selectedDeal
                        )
                    )?.name ||
                    'Unknown stage'
                  }
                </strong>
              </div>

              <div>
                <span>
                  Pipeline
                </span>

                <strong>
                  Sales Pipeline
                </strong>
              </div>

              <div>
                <span>
                  Close Date
                </span>

                <strong>
                  {formatDate(
                    selectedDeal?.closeDate ||
                    selectedDeal?.closedAt ||
                    null
                  )}
                </strong>
              </div>

            </div>

            {selectedDeal.contact && (
              <div className="deal-detail-section">

                <span className="eyebrow">
                  CONTACT
                </span>

                <div className="detail-person">

                  <strong>
                    {[
                      selectedDeal.contact
                        .firstName,
                      selectedDeal.contact
                        .lastName,
                    ]
                      .filter(Boolean)
                      .join(' ') ||
                      'Unknown contact'}
                  </strong>

                  <span>
                    {
                      selectedDeal.contact
                        .email ||
                      'No email'
                    }
                  </span>

                  {selectedDeal.contact
                    .phone && (
                    <span>
                      {
                        selectedDeal.contact
                          .phone
                      }
                    </span>
                  )}

                </div>

              </div>
            )}

            {selectedDeal.company && (
              <div className="deal-detail-section">

                <span className="eyebrow">
                  COMPANY
                </span>

                <div className="detail-company">

                  <strong>
                    {
                      selectedDeal.company
                        .name
                    }
                  </strong>

                  {selectedDeal.company
                    .industry && (
                    <span>
                      {
                        selectedDeal.company
                          .industry
                      }
                    </span>
                  )}

                  {selectedDeal.company
                    .email && (
                    <span>
                      {
                        selectedDeal.company
                          .email
                      }
                    </span>
                  )}

                </div>

              </div>
            )}

            {selectedDeal.description && (
              <div className="deal-detail-section">

                <span className="eyebrow">
                  DESCRIPTION
                </span>

                <p>
                  {selectedDeal.description}
                </p>

              </div>
            )}

          </div>

        </div>
      )}

      {/* CREATE DEAL */}

      {showCreateDeal && (
        <CreateDeal
          onClose={() =>
            setShowCreateDeal(false)
          }

          onCreated={() => {
            setShowCreateDeal(false);
            loadDeals();
          }}
        />
      )}

    </section>
  );
}

export default Deals;