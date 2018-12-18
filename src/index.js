const fs = require('fs');
const path = require('path');
const { isEqualObj } = require('./../src/utils');

const options = {
    oldFile: path.join(__dirname, '../data/customers.json'),
    newFile: path.join(__dirname, '../data/customers-out.json'),
};

let oldData = fs.readFileSync(options.oldFile, 'utf8');
let newData = fs.readFileSync(options.newFile, 'utf8');

oldData = JSON.parse(oldFile);
newData = JSON.parse(newFile);

let count = 0;

for (let i = 0; i < newData.length; i++) {
    let entry = newData[i];

    let oldRecord = oldData.find(obj => obj.customerCode === entry.customerCode);

    if (oldRecord) {
        if (!isEqualObj(entry, oldRecord)) {
            console.log(entry);
            count++;
        }
    } else {
        console.log(entry);
        count++;
    }
}

console.log(count);