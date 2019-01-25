const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const Promise = require('bluebird');

function formatData(obj) {
    let res = {
        properties: [],
        associations: {
            ...obj.associations,
        },
    };
    let keys = Object.keys(obj.properties);
    for (let i = 0; i < keys.length; i++) {
        if (keys[i] !== 'customer_code') {
            res.properties.push({
                name: keys[i],
                value: obj.properties[keys[i]],
            });
        }
    }
    return res;
}

module.exports = async function uploadDeals(data, options) {
    options = Object.assign({}, options);

    // Upload data to HubSpot
    if (options.upload) {
        console.log(`Updating ${data.length} deals in HubSpot...`);

        let count = 0;

        promises = data.map(entry => {
            return hubspot.deals
                .create(formatData(entry))
                .then(deal => {
                    count++;
                    console.log(deal);
                })
                .catch(err => {
                    console.log(err);
                });
        });

        return await Promise.all(promises).then(() => {
            console.log(`${count} deals added.`);
        });
    }

    return;
};
