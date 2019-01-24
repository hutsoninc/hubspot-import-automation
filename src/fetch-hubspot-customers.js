const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

module.exports = async function fetchHubspotCustomers(options) {
    let deals = [];

    options = Object.assign(
        {
            count: 100,
            property: ['email', 'customer_code']
        },
        options
    );

    async function loop() {
        let set = await hubspot.contacts.get(options);

        options.vidOffset = set['vid-offset'];

        deals = deals.concat(set.contacts);

        if (set['has-more']) {
            console.log(deals.length + ' HubSpot customers fetched');
            return;
        } else {
            await loop();
        }
    }

    await loop();

    return deals;
};
