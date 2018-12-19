const fs = require('fs');
const path = require('path');
const { isEqualObj } = require('./utils');
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

const options = {
    oldFile: path.join(__dirname, '../../data/deals-filtered-old.json'),
    newFile: path.join(__dirname, '../../data/deals-out.json'),
};

run = async () => {

    let oldData = fs.readFileSync(options.oldFile, 'utf8');
    let newData = fs.readFileSync(options.newFile, 'utf8');

    oldData = JSON.parse(oldData);
    newData = JSON.parse(newData);

    let changedCount = 0;
    let count = 0;
    let i = 0;

    (async function loop() {

        let entry = newData[i];

        let oldRecord = oldData.find(obj => {
            if (obj && entry) {
                return obj.stock_number === entry.stock_number;
            } else {
                return false;
            }
        });

        if (oldRecord) {
            if (!isEqualObj(entry, oldRecord)) {
                // Update deal
                console.log('Deal properties changed: ', entry);
                changedCount++;
            }
        } else {
            // Create new deal
            let deal = await hubspot.deals.create(formatData(entry));
            console.log(deal);
            count++;
        }

        if (i === newData.length - 1) {
            console.log(changedCount + ' deals need manual update.');
            console.log(count + ' deals added.');
            process.exit(0);
        } else {
            i++;
            loop();
        }

    })();

}

formatData = obj => {
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

run()
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
