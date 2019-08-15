const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const Promise = require('bluebird');

const formatData = obj => {
    const properties = [];

    Object.keys(obj).forEach(property => {
        properties.push({
            property,
            value: obj[property],
        });
    });

    return {
        properties,
    };
};

const uploadCustomers = async (data, options) => {
    if (!options.upload) {
        return;
    }

    console.log('Updating customers in HubSpot...');

    const total = data.length;
    let count = 0;
    const errLogs = [];

    const promises = data.map(entry => {
        return hubspot.contacts
            .createOrUpdate(entry.email, formatData(entry))
            .then(contact => {
                count++;
                console.log(`Uploaded customer ${count}/${total}`);
            })
            .catch(err => {
                console.log(err.message);
                errLogs.push(err.message);
            });
    });

    return await Promise.all(promises).then(() => {
        console.log(`${count} contacts updated or added.`);
        return errLogs;
    });
};

module.exports = uploadCustomers;
