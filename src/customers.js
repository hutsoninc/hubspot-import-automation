const fs = require('fs');
const path = require('path');
const { isEqualObj } = require('./utils');
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const scrub = require('./customers-scrubber');
const csv = require('csvtojson');
const Bottleneck = require('bottleneck');
const Promise = require('bluebird');

const limiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 100,
});

const options = {
    input: path.join(__dirname, '../../data/customers.csv'), // Data from query
    previousImport: path.join(__dirname, '../../data/customers-out.json'), // Previous import data
    upload: true // Should the new data be uploaded to HubSpot
};

function formatData(obj) {
    let res = {
        properties: []
    };
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        res.properties.push({
            property: keys[i],
            value: obj[keys[i]]
        });
    }
    return res;
}

module.exports = async function run() {

    let input = fs.readFileSync(options.input, 'utf8');
    let previousImport = fs.readFileSync(options.previousImport, 'utf8');

    // Read CSV and convert to JSON
    data = await csv().fromString(input);

    // Scrub data
    data = scrub(data);

    // Get previous import data
    previousImport = JSON.parse(previousImport);

    // Upload data to HubSpot
    if (options.upload) {
        console.log('Updating customers in HubSpot...');

        let count = 0;

        return await Promise.all(data.map(entry => {
            // Find customer in previous import
            let record = previousImport.find(obj => {
                if (obj && entry) {
                    return obj.customer_code === entry.customer_code;
                } else {
                    return false;
                }
            });

            if (record) {
                // Check if record has changed
                if (!isEqualObj(entry, record)) {
                    // Update contact
                    return limiter.schedule(() => hubspot.contacts.createOrUpdate(entry.email, formatData(entry)))
                        .then(contact => {
                            count++;
                            console.log(contact);
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            } else {
                // Create new
                return limiter.schedule(() => hubspot.contacts.createOrUpdate(entry.email, formatData(entry)))
                    .then(contact => {
                        count++;
                        console.log(contact);
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
        })).then(_ => {
            console.log(count + ' contacts updated or added.');
            // Write new data to previous import file for next run
            fs.writeFile(options.previousImport, JSON.stringify(data), err => {
                if (err) throw new Error(err);
                return;
            });
        });

    }
}
