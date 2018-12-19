const fs = require('fs');
const path = require('path');
const { isEqualObj } = require('./utils');
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

const options = {
    oldFile: path.join(__dirname, '../../data/customers-old.json'),
    newFile: path.join(__dirname, '../../data/customers-out.json'),
};

run = async () => {

    let oldData = fs.readFileSync(options.oldFile, 'utf8');
    let newData = fs.readFileSync(options.newFile, 'utf8');

    oldData = JSON.parse(oldData);
    newData = JSON.parse(newData);

    let count = 0;
    let i = 0;

    (async function loop() {

        let entry = newData[i];

        let oldRecord = oldData.find(obj => {
            if (obj && entry) {
                return obj.customer_code === entry.customer_code;
            } else {
                return false;
            }
        });

        if (oldRecord) {
            if (!isEqualObj(entry, oldRecord)) {
                // Update contact
                let contact = await hubspot.contacts.createOrUpdate(entry.email, formatData(entry));
                console.log(contact);
                count++;
                console.log(i);
            }
        } else {
            // Create new
            let contact = await hubspot.contacts.createOrUpdate(entry.email, formatData(entry));
            console.log(contact);
            count++;
            console.log(i);
        }

        if (i === newData.length - 1) {
            console.log(count + ' contacts updated or added.');
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
            property: keys[i],
            value: obj[keys[i]]
        });
    }
    return res;
}

run()
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
