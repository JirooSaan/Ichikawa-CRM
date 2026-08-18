import { useEffect, useMemo, useState } from 'react';
import CreateDeal from './CreateDeal';
import './Deals.css';
const API_BASE = 'http://localhost:5000';

function formatCurrency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
  return (
    deal?.name ||
    deal?.properties?.dealname ||
    'Unnamed Deal'
  );
}

function getDealAmount(deal) {
  return (
    deal?.amount ??
    deal?.properties?.amount ??
    '0'
  );
}

function getDealStage(deal) {
  return (
    deal?.stage ||
    deal?.properties?.dealstage ||
    ''
  );
}

function getDealPipeline(deal) {
  return (
    deal?.pipeline ||
    deal?.properties?.pipeline ||
    ''
  );
}

/* =========================================================
   DEAL CARD
========================================================= */

function DealCard({
  deal,
  onDragStart,
  onClick,
}) {
  const properties = deal?.properties || {};

  const contact = deal?.contacts?.[0];
  const company = deal?.companies?.[0];

  const closeDate =
    deal?.closeDate ||
    properties?.closedate ||
    null;

  const contactName = [
    contact?.firstName,
    contact?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const initials =
    (
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
          getDealAmount(deal)
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

/* =========================================================
   DEALS PAGE
========================================================= */

function Deals() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [deals, setDeals] = useState([]);

  const [dealSearch, setDealSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [movingDeal, setMovingDeal] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showCreateDeal, setShowCreateDeal] =useState(false);
  /* =====================================================
     LOAD PIPELINES
  ===================================================== */

  const loadPipelines = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/hubspot/pipelines`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load pipelines'
        );
      }

      const results = Array.isArray(data?.results)
        ? data.results
        : [];

      setPipelines(results);

      if (
        results.length > 0 &&
        !selectedPipeline
      ) {
        setSelectedPipeline(
          results[0].id
        );
      }
    } catch (err) {
      console.error(
        'Pipeline error:',
        err
      );

      setError(
        err.message ||
        'Unable to load pipelines'
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

      const response = await fetch(
        `${API_BASE}/api/hubspot/deals-with-contacts`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Failed to load deals'
        );
      }

      setDeals(
        Array.isArray(data?.results)
          ? data.results
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
    loadPipelines();
    loadDeals();
  }, []);

  /* =====================================================
     SELECTED PIPELINE
  ===================================================== */

  const pipeline = pipelines.find(
    (item) =>
      item.id === selectedPipeline
  );

  const stages = pipeline?.stages || [];

  /* =====================================================
     FILTER DEALS
  ===================================================== */

  const pipelineDeals = useMemo(() => {
    return deals.filter((deal) => {
      const dealPipeline =
        getDealPipeline(deal);

      return (
        !selectedPipeline ||
        dealPipeline === selectedPipeline
      );
    });
  }, [
    deals,
    selectedPipeline,
  ]);
const filteredDeals = useMemo(() => {
    return pipelineDeals.filter((deal) => {
      const search = dealSearch
        .trim()
        .toLowerCase();

      const dealName =
        getDealName(deal).toLowerCase();

      const dealId =
        String(deal.id || '').toLowerCase();

      const contactText =
        (deal.contacts || [])
          .map((contact) =>
            `${contact.firstName || ''} ${
              contact.lastName || ''
            } ${contact.email || ''}`
          )
          .join(' ')
          .toLowerCase();

      const companyText =
        (deal.companies || [])
          .map((company) =>
            `${company.name || ''} ${
              company.domain || ''
            }`
          )
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
        getDealStage(deal) === stageFilter;

      const companyName =
        deal.companies?.[0]?.name ||
        deal.companies?.[0]?.domain ||
        '';

      const matchesCompany =
        companyFilter === 'all' ||
        companyName === companyFilter;

      const amount =
        Number(getDealAmount(deal)) || 0;

      const matchesAmount =
        amountFilter === 'all' ||
        (amountFilter === 'under100k' &&
          amount < 100000) ||
        (amountFilter === '100k500k' &&
          amount >= 100000 &&
          amount < 500000) ||
        (amountFilter === '500k1m' &&
          amount >= 500000 &&
          amount < 1000000) ||
        (amountFilter === 'over1m' &&
          amount >= 1000000);

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
      (total, deal) => {
        return (
          total +
          (
            Number(
              getDealAmount(deal)
            ) || 0
          )
        );
      },
      0
    );
const openDeals = pipelineDeals.filter((deal) => {
  const stage = getDealStage(deal).toLowerCase();

  return (
    !stage.includes('closedwon') &&
    !stage.includes('closedlost') &&
    !stage.includes('won') &&
    !stage.includes('lost')
  );
});

const wonDeals = pipelineDeals.filter((deal) => {
  const stage = getDealStage(deal).toLowerCase();

  return (
    stage.includes('closedwon') ||
    stage.includes('won')
  );
});

const lostDeals = pipelineDeals.filter((deal) => {
  const stage = getDealStage(deal).toLowerCase();

  return (
    stage.includes('closedlost') ||
    stage.includes('lost')
  );
});

const wonValue = wonDeals.reduce(
  (total, deal) =>
    total +
    (Number(getDealAmount(deal)) || 0),
  0
);

const lostValue = lostDeals.reduce(
  (total, deal) =>
    total +
    (Number(getDealAmount(deal)) || 0),
  0
);

const winRate =
  wonDeals.length + lostDeals.length > 0
    ? (
        (wonDeals.length /
          (wonDeals.length + lostDeals.length)) *
        100
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

  const handleDragOver = (event) => {
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

      /* Optimistic update */

      setDeals((currentDeals) =>
        currentDeals.map((deal) => {
          if (
            deal.id !==
            movingDeal.id
          ) {
            return deal;
          }

          return {
            ...deal,

            stage: stage.id,

            properties: {
              ...deal.properties,
              dealstage: stage.id,
            },
          };
        })
      );

      /* Update HubSpot */

      const response = await fetch(
        `${API_BASE}/api/hubspot/deals/${movingDeal.id}/stage`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            dealstage: stage.id,
            pipeline:
              selectedPipeline,
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
            HUBSPOT CRM
          </span>

          <h2>
            Loading Deals...
          </h2>

          <p>
            Retrieving pipelines, stages and
            deals from HubSpot.
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

  <select
    className="pipeline-selector"
    value={selectedPipeline}
    onChange={(event) =>
      setSelectedPipeline(
        event.target.value
      )
    }
  >
    {pipelines.map((item) => (
      <option
        key={item.id}
        value={item.id}
      >
        {item.label || item.name}
      </option>
    ))}
  </select>

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
      loadPipelines();
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
      Pipeline Error
    </h3>

    <p>
      {error}
    </p>

    <button
      className="secondary-button"
      onClick={() => {
        setError('');
        loadPipelines();
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
              setDealSearch(event.target.value)
            }
          />
        </div>

        <select
          className="deal-filter-select"
          value={stageFilter}
          onChange={(event) =>
            setStageFilter(event.target.value)
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
              {stage.label || stage.name}
            </option>
          ))}
        </select>

        <select
          className="deal-filter-select"
          value={companyFilter}
          onChange={(event) =>
            setCompanyFilter(event.target.value)
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
                    deal.companies?.[0]?.name ||
                    deal.companies?.[0]?.domain
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
            setAmountFilter(event.target.value)
          }
        >
          <option value="all">
            All amounts
          </option>
          <option value="under100k">
            Under $100K
          </option>
          <option value="100k500k">
            $100K – $500K
          </option>
          <option value="500k1m">
            $500K – $1M
          </option>
          <option value="over1m">
            Over $1M
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
      {pipelineDeals.length} total deals
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
            (Number(
              getDealAmount(deal)
            ) || 0),
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
      {formatCurrency(wonValue)}
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
      {formatCurrency(lostValue)}
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
      {/* PIPELINE */}

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
              (total, deal) => {
                return (
                  total +
                  (
                    Number(
                      getDealAmount(deal)
                    ) || 0
                  )
                );
              },
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
                      {stage.label}
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

                {stageDeals.map((deal) => (
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
                ))}

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
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Stage
                </span>

                <strong>
                  {stages.find(
                    (stage) =>
                      stage.id ===
                      getDealStage(
                        selectedDeal
                      )
                  )?.label ||
                    getDealStage(
                      selectedDeal
                    )}
                </strong>
              </div>

              <div>
                <span>
                  Pipeline
                </span>

                <strong>
                  {pipeline?.label ||
                    pipeline?.name ||
                    'Sales Pipeline'}
                </strong>
              </div>

              <div>
                <span>
                  Close Date
                </span>

                <strong>
                  {formatDate(
                    selectedDeal?.closeDate ||
                    selectedDeal?.properties?.closedate ||
                    null
                  )}
                </strong>
              </div>

            </div>

            {selectedDeal.contacts?.length > 0 && (
              <div className="deal-detail-section">

                <span className="eyebrow">
                  CONTACT
                </span>

                {selectedDeal.contacts.map(
                  (contact) => (
                    <div
                      className="detail-person"
                      key={contact.id}
                    >
                      <strong>
                        {[
                          contact.firstName,
                          contact.lastName,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </strong>

                      <span>
                        {contact.email}
                      </span>
                    </div>
                  )
                )}

              </div>
            )}

            {selectedDeal.companies?.length > 0 && (
              <div className="deal-detail-section">

                <span className="eyebrow">
                  COMPANY
                </span>

                {selectedDeal.companies.map(
                  (company) => (
                    <div
                      className="detail-company"
                      key={company.id}
                    >
                      <strong>
                        {company.name}
                      </strong>

                      <span>
                        {company.domain}
                      </span>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      )}
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