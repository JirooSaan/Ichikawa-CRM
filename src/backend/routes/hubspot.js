import express from 'express';

const router = express.Router();

const HUBSPOT_BASE = 'https://api.hubapi.com';

/*
|--------------------------------------------------------------------------
| HubSpot Request Helper
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
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `HubSpot returned invalid JSON (${response.status})`
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
    const data =
      await hubspotFetch(
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
      error:
        'Failed to retrieve contacts',
      message:
        error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Single Contact
|--------------------------------------------------------------------------
*/

router.get(
  '/contacts/:id',
  async (req, res) => {
    try {
      const data =
        await hubspotFetch(
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
        error:
          'Failed to retrieve contact',
        message:
          error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Create Contact
|--------------------------------------------------------------------------
*/

router.post(
  '/contacts',
  async (req, res) => {
    try {
      const data =
        await hubspotFetch(
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
        error:
          'Failed to create contact',
        message:
          error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Companies
|--------------------------------------------------------------------------
*/

router.get(
  '/companies',
  async (req, res) => {
    try {
      const data =
        await hubspotFetch(
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
        error:
          'Failed to retrieve companies',
        message:
          error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Deals
|--------------------------------------------------------------------------
*/

router.get(
  '/deals',
  async (req, res) => {
    try {
      const data =
        await hubspotFetch(
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
        error:
          'Failed to retrieve deals',
        message:
          error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Deals + Contacts + Companies
|--------------------------------------------------------------------------
*/

router.get(
  '/deals-with-contacts',
  async (req, res) => {
    try {
      const dealsData =
        await hubspotFetch(
          '/crm/v3/objects/deals' +
            '?limit=100' +
            '&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate' +
            '&associations=contacts,companies'
        );

      const deals = [];

      for (
        const deal of
        dealsData.results || []
      ) {

        const contactIds =
          deal.associations
            ?.contacts
            ?.results
            ?.map(
              (item) => item.id
            ) || [];

        const companyIds =
          deal.associations
            ?.companies
            ?.results
            ?.map(
              (item) => item.id
            ) || [];


        /*
        |--------------------------------------------------------------------------
        | Contacts
        |--------------------------------------------------------------------------
        */

        const contacts = [];

        for (
          const contactId of
          contactIds
        ) {
          try {
            const contact =
              await hubspotFetch(
                `/crm/v3/objects/contacts/${contactId}` +
                  '?properties=firstname,lastname,email,phone,company,jobtitle'
              );

            contacts.push({
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
            });

          } catch (error) {
            console.error(
              `Failed to retrieve contact ${contactId}:`,
              error.message
            );
          }
        }


        /*
        |--------------------------------------------------------------------------
        | Companies
        |--------------------------------------------------------------------------
        */

        const companies = [];

        for (
          const companyId of
          companyIds
        ) {
          try {
            const company =
              await hubspotFetch(
                `/crm/v3/objects/companies/${companyId}` +
                  '?properties=name,domain,industry,phone,city,state,country'
              );

            const companyName =
              company.properties
                ?.name?.trim() || '';

            const domain =
              company.properties
                ?.domain?.trim() || '';

            companies.push({
              id: company.id,

              name:
                companyName ||
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
            });

          } catch (error) {
            console.error(
              `Failed to retrieve company ${companyId}:`,
              error.message
            );
          }
        }


        /*
        |--------------------------------------------------------------------------
        | Deal
        |--------------------------------------------------------------------------
        */

        deals.push({
          id: deal.id,

          name:
            deal.properties
              ?.dealname ||
            'Unnamed Deal',

          amount:
            deal.properties
              ?.amount || '0',

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

          contacts,

          companies,
        });
      }

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

/*
|--------------------------------------------------------------------------
| Create Deal
|--------------------------------------------------------------------------
*/

router.post(
  '/deals',
  async (req, res) => {
    try {
      const {
        dealname,
        amount,
        dealstage,
        pipeline,
        closedate,
        contactId,
        companyId,
      } = req.body;

      const properties = {
        dealname:
          dealname || '',

        amount:
          amount !== undefined
            ? String(amount)
            : '0',

        dealstage:
          dealstage || '',

        pipeline:
          pipeline || 'default',
      };

      if (closedate) {
        properties.closedate =
          closedate;
      }

      const data =
        await hubspotFetch(
          '/crm/v3/objects/deals',
          {
            method: 'POST',

            body: JSON.stringify({
              properties,
            }),
          }
        );

      const dealId =
        data.id;

      /*
      |--------------------------------------------------------------------------
      | Associate Contact
      |--------------------------------------------------------------------------
      */

      if (contactId) {
        try {
          await hubspotFetch(
            `/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`,
            {
              method: 'PUT',

              body: JSON.stringify([
                {
                  associationCategory:
                    'HUBSPOT_DEFINED',

                  associationTypeId:
                    3,
                },
              ]),
            }
          );
        } catch (error) {
          console.error(
            'Contact association failed:',
            error.message
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Associate Company
      |--------------------------------------------------------------------------
      */

      if (companyId) {
        try {
          await hubspotFetch(
            `/crm/v4/objects/deals/${dealId}/associations/companies/${companyId}`,
            {
              method: 'PUT',

              body: JSON.stringify([
                {
                  associationCategory:
                    'HUBSPOT_DEFINED',

                  associationTypeId:
                    5,
                },
              ]),
            }
          );
        } catch (error) {
          console.error(
            'Company association failed:',
            error.message
          );
        }
      }

      res.status(201).json(
        data
      );

    } catch (error) {
      console.error(
        'HubSpot create deal error:',
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          'Failed to create deal',

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
| Update Deal Stage
|--------------------------------------------------------------------------
*/

router.patch(
  '/deals/:id/stage',
  async (req, res) => {
    try {
      const {
        dealstage,
        pipeline,
      } = req.body;

      if (!dealstage) {
        return res.status(400).json({
          error:
            'dealstage is required',
        });
      }

      const properties = {
        dealstage,
      };

      if (pipeline) {
        properties.pipeline =
          pipeline;
      }

      const data =
        await hubspotFetch(
          `/crm/v3/objects/deals/${req.params.id}`,
          {
            method: 'PATCH',

            body: JSON.stringify({
              properties,
            }),
          }
        );

      res.json(data);

    } catch (error) {
      console.error(
        'HubSpot update deal stage error:',
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          'Failed to update deal stage',

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
| Update Deal
|--------------------------------------------------------------------------
*/

router.patch(
  '/deals/:id',
  async (req, res) => {
    try {
      const properties = {};

      if (
        req.body.dealname !==
        undefined
      ) {
        properties.dealname =
          req.body.dealname;
      }

      if (
        req.body.amount !==
        undefined
      ) {
        properties.amount =
          String(
            req.body.amount
          );
      }

      if (
        req.body.dealstage !==
        undefined
      ) {
        properties.dealstage =
          req.body.dealstage;
      }

      if (
        req.body.closedate !==
        undefined
      ) {
        properties.closedate =
          req.body.closedate || '';
      }

      if (
        req.body.pipeline !==
        undefined
      ) {
        properties.pipeline =
          req.body.pipeline;
      }

      if (
        Object.keys(properties)
          .length === 0
      ) {
        return res.status(400).json({
          error:
            'No deal properties supplied',
        });
      }

      const data =
        await hubspotFetch(
          `/crm/v3/objects/deals/${req.params.id}`,
          {
            method: 'PATCH',

            body: JSON.stringify({
              properties,
            }),
          }
        );

      res.json(data);

    } catch (error) {
      console.error(
        'HubSpot update deal error:',
        error
      );

      res.status(
        error.status || 500
      ).json({
        error:
          'Failed to update deal',

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
| Export Router
|--------------------------------------------------------------------------
*/

export default router;