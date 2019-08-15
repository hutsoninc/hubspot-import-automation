const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const Promise = require('bluebird');

function formatData(obj) {
    const properties = [];

    Object.keys(obj.properties).forEach(property => {
        properties.push({
            name: property,
            value: [obj.properties[property]],
        });
    });

    return {
        properties,
        associations: {
            ...obj.associations,
        },
    };
}

const uploadParts = async (data, options) => {
    if (!options.upload) {
        return;
    }

    console.log(`Updating ${data.length} parts deals in HubSpot...`);

    const total = data.length;
    let count = 0;
    const errLogs = [];

    const promises = data.map(entry => {
        return hubspot.deals
            .create(formatData(entry))
            .then(deal => {
                count++;
                console.log(`Uploaded part deal ${count}/${total}`);
            })
            .catch(err => {
                console.log(err.message);
                errLogs.push(err.message);
            });
    });

    return await Promise.all(promises).then(() => {
        console.log(`${count} parts deals added.`);
        return errLogs;
    });
};

module.exports = uploadParts;
