const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const Promise = require('bluebird');

const formatData = obj => {
    const properties = [];

    Object.keys(obj.properties).forEach(property => {
        if (property !== 'customer_code') {
            properties.push({
                name: property,
                value: obj.properties[property],
            });
        }
    });

    return {
        properties,
        associations: {
            ...obj.associations,
        },
    };
};

const uploadDeals = async (data, options) => {
    if (!options.upload) {
        return;
    }

    console.log(`Updating ${data.length} deals in HubSpot...`);

    const total = data.length;
    let count = 0;
    const errLogs = [];

    const promises = data.map(entry => {
        return hubspot.deals
            .create(formatData(entry))
            .then(deal => {
                count++;
                console.log(`Uploaded deal ${count}/${total}`);
            })
            .catch(err => {
                console.log(err.message);
                errLogs.push(err.message);
            });
    });

    return await Promise.all(promises).then(() => {
        console.log(`${count} deals added.`);
        return errLogs;
    });
};

module.exports = uploadDeals;
