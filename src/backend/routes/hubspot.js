import express from 'express';

const router = express.Router();

const HUBSPOT_BASE = 'https://api.hubapi.com';

/*
|--------------------------------------------------------------------------
| HubSpot request helper
|--------------------------------------------------------------------------
*/

async function hubspotFetch(path, options = {}) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      'HUBSPOT_ACCESS_TOKEN is missing from backend .env'
    );
  }

  const response = await fetch(
    `${HUBSPOT_BASE}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `HubSpot returned invalid JSON (${response.status}): ${text.slice(
        0,
        200
      )}`
    );
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
        `HubSpot request failed with status ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| HubSpot Status
|--------------------------------------------------------------------------
*/

router.get('/status', async (req, res) => {
  try {
    await hubspotFetch(
      '/crm/v3/objects/contacts?limit=1'
    );

    res.json({
      connected: true,
      service: 'HubSpot',
      message: 'HubSpot connection successful',
    });
  } catch (error) {
    console.error(
      'HubSpot status error:',
      error
    );

    res.status(
      error.status || 500
    ).json({
      connected: false,
      service: 'HubSpot',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Contacts
|--------------------------------------------------------------------------
*/

router.get('/contacts', async (req, res) => {
  try {
    const data = await hubspotFetch(
      '/crm/v3/objects/contacts' +
        '?limit=100' +
        '&properties=firstname,lastname,email,phone,company,jobtitle,createdate,lastmodifieddate'
    );

    res.json(data);

  } catch (error) {
    console.error(
      'HubSpot contacts error:',
      error
    );

    res.status(
      error.status || 500
    ).json({
      error: 'Failed to retrieve contacts',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Single Contact
|--------------------------------------------------------------------------
*/

router.get('/contacts/:id', async (req, res) => {
  try {
    const data = await hubspotFetch(
      `/crm/v3/objects/contacts/${req.params.id}` +
        '?properties=firstname,lastname,email,phone,company,jobtitle,createdate,lastmodifieddate'
    );

    res.json(data);

  } catch (error) {
    console.error(
      'HubSpot contact error:',
      error
    );

    res.status(
      error.status || 500
    ).json({
      error: 'Failed to retrieve contact',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Create Contact
|--------------------------------------------------------------------------
*/

router.post('/contacts', async (req, res) => {
  try {
    const data = await hubspotFetch(
      '/crm/v3/objects/contacts',
      {
        method: 'POST',

        body: JSON.stringify({
          properties: {
            firstname:
              req.body.firstname || '',

            lastname:
              req.body.lastname || '',

            email:
              req.body.email || '',

            phone:
              req.body.phone || '',

            company:
              req.body.company || '',

            jobtitle:
              req.body.jobtitle || '',
          },
        }),
      }
    );

    res.status(201).json(data);

  } catch (error) {
    console.error(
      'HubSpot create contact error:',
      error
    );

    res.status(
      error.status || 500
    ).json({
      error: 'Failed to create contact',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Companies
|--------------------------------------------------------------------------
*/

router.get('/companies', async (req, res) => {
  try {
    const data = await hubspotFetch(
      '/crm/v3/objects/companies' +
        '?limit=100' +
        '&properties=name,domain,industry,phone,city,state,country,createdate'
    );

    res.json(data);

  } catch (error) {
    console.error(
      'HubSpot companies error:',
      error
    );

    res.status(
      error.status || 500
    ).json({
      error: 'Failed to retrieve companies',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Deals
|--------------------------------------------------------------------------
*/

router.get('/deals', async (req, res) => {
  try {
    const data = await hubspotFetch(
      '/crm/v3/objects/deals' +
        '?limit=100' +
        '&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate'
    );

    res.json(data);

  } catch (error) {
    console.error(
      'HubSpot deals error:',
      error
    );

    res.status(
      error.status || 500
    ).json({
      error: 'Failed to retrieve deals',
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Deals + Contacts + Companies
|--------------------------------------------------------------------------
*/

router.get(
  '/deals-with-contacts',
  async (req, res) => {
    try {
      /*
       * Get deals + association IDs
       */
      const dealsData = await hubspotFetch(
        '/crm/v3/objects/deals' +
          '?limit=100' +
          '&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate' +
          '&associations=contacts,companies'
      );

      const rawDeals =
        dealsData.results || [];

      /*
       * Get unique contact IDs
       */
      const contactIds = [
        ...new Set(
          rawDeals.flatMap(
            (deal) =>
              deal.associations?.contacts?.results?.map(
                (item) => String(item.id)
              ) || []
          )
        ),
      ];

      /*
       * Get unique company IDs
       */
      const companyIds = [
        ...new Set(
          rawDeals.flatMap(
            (deal) =>
              deal.associations?.companies?.results?.map(
                (item) => String(item.id)
              ) || []
          )
        ),
      ];

      /*
       * Batch read contacts / companies
       */
      async function batchRead(
        objectType,
        ids,
        properties
      ) {
        if (!ids.length) {
          return [];
        }

        try {
          const data =
            await hubspotFetch(
              `/crm/v3/objects/${objectType}/batch/read`,
              {
                method: 'POST',

                body: JSON.stringify({
                  properties,

                  inputs: ids.map(
                    (id) => ({
                      id,
                    })
                  ),
                }),
              }
            );

          return data.results || [];

        } catch (error) {
          console.warn(
            `Batch read failed for ${objectType}. Using fallback.`,
            error.message
          );

          const results =
            await Promise.all(
              ids.map(
                async (id) => {
                  try {
                    return await hubspotFetch(
                      `/crm/v3/objects/${objectType}/${id}` +
                        `?properties=${properties.join(',')}`
                    );

                  } catch (itemError) {
                    console.error(
                      `Failed to retrieve ${objectType} ${id}:`,
                      itemError.message
                    );

                    return null;
                  }
                }
              )
            );

          return results.filter(Boolean);
        }
      }

      /*
       * Load contacts + companies together
       */
      const [
        contactResults,
        companyResults,
      ] = await Promise.all([
        batchRead(
          'contacts',
          contactIds,
          [
            'firstname',
            'lastname',
            'email',
            'phone',
            'company',
            'jobtitle',
          ]
        ),

        batchRead(
          'companies',
          companyIds,
          [
            'name',
            'domain',
            'industry',
            'phone',
            'city',
            'state',
            'country',
          ]
        ),
      ]);

      /*
       * Contact lookup map
       */
      const contactMap =
        new Map(
          contactResults.map(
            (contact) => [
              String(contact.id),

              {
                id: contact.id,

                firstName:
                  contact.properties
                    ?.firstname || '',

                lastName:
                  contact.properties
                    ?.lastname || '',

                email:
                  contact.properties
                    ?.email || '',

                phone:
                  contact.properties
                    ?.phone || '',

                company:
                  contact.properties
                    ?.company || '',

                jobTitle:
                  contact.properties
                    ?.jobtitle || '',
              },
            ]
          )
        );

      /*
       * Company lookup map
       */
      const companyMap =
        new Map(
          companyResults.map(
            (company) => {
              const name =
                company.properties
                  ?.name?.trim() || '';

              const domain =
                company.properties
                  ?.domain?.trim() || '';

              return [
                String(company.id),

                {
                  id: company.id,

                  name:
                    name ||
                    domain ||
                    'Unnamed company',

                  domain,

                  industry:
                    company.properties
                      ?.industry || '',

                  phone:
                    company.properties
                      ?.phone || '',

                  city:
                    company.properties
                      ?.city || '',

                  state:
                    company.properties
                      ?.state || '',

                  country:
                    company.properties
                      ?.country || '',
                },
              ];
            }
          )
        );

      /*
       * Build final deals response
       */
      const deals =
        rawDeals.map(
          (deal) => {
            const dealContactIds =
              deal.associations
                ?.contacts?.results?.map(
                  (item) =>
                    String(item.id)
                ) || [];

            const dealCompanyIds =
              deal.associations
                ?.companies?.results?.map(
                  (item) =>
                    String(item.id)
                ) || [];

            return {
              id: deal.id,

              name:
                deal.properties
                  ?.dealname ||
                'Unnamed Deal',

              amount:
                deal.properties
                  ?.amount ||
                '0',

              stage:
                deal.properties
                  ?.dealstage ||
                'Unknown',

              pipeline:
                deal.properties
                  ?.pipeline ||
                'default',

              closeDate:
                deal.properties
                  ?.closedate ||
                null,

              createdAt:
                deal.properties
                  ?.createdate ||
                null,

              updatedAt:
                deal.properties
                  ?.hs_lastmodifieddate ||
                null,

              contacts:
                dealContactIds
                  .map(
                    (id) =>
                      contactMap.get(id)
                  )
                  .filter(Boolean),

              companies:
                dealCompanyIds
                  .map(
                    (id) =>
                      companyMap.get(id)
                  )
                  .filter(Boolean),
            };
          }
        );

      res.json({
        results: deals,
        total: deals.length,
      });

    } catch (error) {
      console.error(
        'HubSpot deals-with-contacts error:',
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          'Failed to retrieve deals and contacts',

        message:
          error.message,

        details:
          error.data || null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Pipelines
|--------------------------------------------------------------------------
*/

router.get(
  '/pipelines',
  async (req, res) => {
    try {
      const data =
        await hubspotFetch(
          '/crm/v3/pipelines/deals'
        );

      res.json(data);

    } catch (error) {
      console.error(
        'HubSpot pipelines error:',
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          'Failed to retrieve pipelines',

        message:
          error.message,
      });
    }
  }
);

export default router;