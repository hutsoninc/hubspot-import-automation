const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

module.exports = async function fetchHubspotCustomers(count) {
    let i = 0;
    if (count === undefined) {
        count = 500;
    }
    let pages = count / 100;
    let deals = [];
    var vidOffset

    async function loop() {

        let options = {
            count: 100
        }

        if (vidOffset !== undefined) {
            options.vidOffset = vidOffset
        }

        let set = await hubspot.contacts.get(options);

        // set vidOffset
        vidOffset = set['vid-offset']

        set = set.contacts

        deals = deals.concat(set);

        if (i === pages - 1) {
            console.log(deals.length + ' HubSpot customers fetched');
            return;
        } else {
            i++;
            await loop();
        }

    };

    await loop();

    return deals
}