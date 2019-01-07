const fs = require('fs');
const path = require('path');
const { isEqualObj } = require('./utils');
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const scrub = require('./deals-scrubber');
const fetchHubspotDeals = require('./fetch-hubspot-deals');
const fetchHubspotCustomers = require('./fetch-hubspot-customers');
const csv = require('csvtojson');
const Promise = require('bluebird');
const pLimit = require('p-limit');

const limit = pLimit(5);

const options = {
    input: path.join(__dirname, '../../data/deals.csv'), // Data from query
    previousImport: path.join(__dirname, '../../data/deals-out.json'), // Previous import data
    customersData: path.join(__dirname, '../../data/customers-out.json'), // Current customer data
    upload: true // Should the new data be uploaded to HubSpot
};

function formatData(obj) {
    let res = {
        properties: []
    };
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        res.properties.push({
            name: keys[i],
            value: obj[keys[i]],
        });
    }
    return res;
}

module.exports = async function run() {

    let input = fs.readFileSync(options.input, 'utf8');
    let previousImport = fs.readFileSync(options.previousImport, 'utf8');
    let customersData = fs.readFileSync(options.customersData, 'utf8');

    // Read CSV and convert to JSON
    data = await csv().fromString(input);

    // Scrub data
    data = scrub(data);

    // Filter out deals without a customer record
    customersData = JSON.parse(customersData);
    customersData = customersData.map(customer => customer.customer_code.toUpperCase());

    console.log('Filtering ' + data.length + ' records');

    data = data.filter(obj => {
        if (obj.customer_code && (customersData.indexOf(obj.customer_code.toUpperCase()) >= 0)) {
            return true;
        }
        return false;
    });

    // Get previous import data
    previousImport = JSON.parse(previousImport);

    // Upload data to HubSpot
    if (options.upload) {
        console.log('Updating deals in HubSpot...');

        // let hubspotDeals = await fetchHubspotDeals();
        // let hubspotCustomers = await fetchHubspotCustomers();

        // TODO
        // - Associate HS customers with deals
        // - Associate imported deals with HS deals
        // - Close out deals created from forms on website
        // - Update deals with changed properties from equip

        let count = 0;

        let promises = data.map(entry => {
            // Find deal in previous import
            let record = previousImport.find(obj => {
                if (obj && entry) {
                    return obj.stock_number === entry.stock_number;
                } else {
                    return false;
                }
            });

            if (record) {
                // Check if record has changed
                if (!isEqualObj(entry, record)) {
                    // Update deal
                    console.log('Deal properties changed: ', JSON.stringify(entry));
                    count++;
                    return;
                }
                return;
            } else {
                // Create new
                return limit(() => hubspot.deals.create(formatData(entry))
                    .then(deal => {
                        count++;
                        console.log(deal);
                    })
                    .catch(err => {
                        console.error(err);
                    }));
            }
        }).filter(obj => obj);

        return await Promise.all(promises).then(() => {
            console.log(count + ' deals updated or added.');
            // Write new data to previous import file for next run
            fs.writeFile(options.previousImport, JSON.stringify(data), err => {
                if (err) throw new Error(err);
                return;
            });
        });

    }
}
