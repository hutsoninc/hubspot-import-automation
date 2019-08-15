const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

const fetchHubspotCustomers = async options => {
    const deals = [];

    options = Object.assign(
        {
            count: 100,
            property: ['email', 'customer_code', 'customer_account_number'],
        },
        options
    );

    const loop = async () => {
        const set = await hubspot.contacts.get(options);

        options.vidOffset = set['vid-offset'];

        deals.push(...set.contacts);

        if (set['has-more']) {
            await loop();
        } else {
            console.log(deals.length + ' HubSpot customers fetched');
            return;
        }
    };

    await loop();

    return deals;
};

module.exports = fetchHubspotCustomers;
