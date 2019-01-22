const fs = require('fs');
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const Promise = require('bluebird');

function formatData(obj) {
    let res = {
        properties: [],
    };
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        res.properties.push({
            property: keys[i],
            value: obj[keys[i]],
        });
    }
    return res;
}

module.exports = async function uploadCustomers(data, options) {
    options = Object.assign({}, options);

    // Upload data to HubSpot
    if (options.upload) {
        console.log('Updating customers in HubSpot...');

        let count = 0;

        let promises = data.map(entry => {
            return hubspot.contacts
                .createOrUpdate(entry.email, formatData(entry))
                .then(contact => {
                    count++;
                    console.log(contact);
                })
                .catch(err => {
                    console.error(err);
                });
        });

        return await Promise.all(promises).then(() => {
            console.log(count + ' contacts updated or added.');
            // Write new data to previous import file for next run
            fs.writeFile(
                options.customers.previousImport,
                JSON.stringify(data),
                err => {
                    if (err) throw new Error(err);
                    return;
                }
            );
        });
    } else {
        fs.writeFileSync(
            options.customers.previousImport,
            JSON.stringify(data)
        );
    }

    return;
};
