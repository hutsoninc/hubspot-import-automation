require('dotenv').config({ path: './../.env' });
const fs = require('fs');
const path = require('path');
const { isEqualObj } = require('./../src/utils');
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });

const options = {
    oldFile: path.join(__dirname, '../data/customers1.json'),
    newFile: path.join(__dirname, '../data/customers2.json'),
};

run = async () => {

    let oldData = fs.readFileSync(options.oldFile, 'utf8');
    let newData = fs.readFileSync(options.newFile, 'utf8');

    oldData = JSON.parse(oldData);
    newData = JSON.parse(newData);

    let count = 0;
    let i = 6136;

    (async function loop() {

        let entry = newData[i];

        let oldRecord = oldData.find(obj => {
            if (obj && entry) {
                return obj.customerCode === entry.customerCode;
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
    let properties = {
        email: obj.email,
        phone: obj.phone,
        mobilephone: obj.mobile,
        state: obj.state,
        zip: obj.zip,
        branch: obj.branch,
        customer_code: obj.customerCode,
        address: obj.address,
        city: obj.city
    }
    let res = {
        properties: []
    };
    let keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i++) {
        res.properties.push({
            property: keys[i],
            value: properties[keys[i]],
        });
    }
    return res;
}

run()
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
