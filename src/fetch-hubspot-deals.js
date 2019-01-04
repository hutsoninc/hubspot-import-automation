const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

module.exports = async function fetchHubspotDeals(count) {
    let i = 0;
    if (count === undefined) {
        count = 500;
    }
    let pages = count / 100;
    let deals = [];

    async function loop() {

        let set = await hubspot.deals.getRecentlyCreated({
            count: 100,
            offset: 100 * i
        });

        set = set.results

        deals = deals.concat(set);

        if (i === pages - 1) {
            console.log(deals.length + ' HubSpot deals fetched');
            return;
        } else {
            i++;
            await loop();
        }

    };

    await loop();

    return deals
}