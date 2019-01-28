'use strict';
require('dotenv').config();
const nodemailer = require('nodemailer');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');
const fetchHubspotCustomers = require('./src/fetch-hubspot-customers');
const scrubCustomers = require('./src/customers-scrubber');
const scrubDeals = require('./src/deals-scrubber');
const scrubParts = require('./src/parts-scrubber');
const csv = require('csvtojson');
const Promise = require('bluebird');
const uploadCustomers = require('./src/customers');
const uploadDeals = require('./src/deals');
const uploadParts = require('./src/parts');
const { isEqualObj, removeEmptyValues } = require('./src/utils');

const isRunning = async query => {
    return new Promise(function(resolve, reject) {
        exec('tasklist', (err, stdout, stderr) => {
            if (err) reject(err);
            if (stderr) reject(stderr);
            resolve(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
        });
    });
};

const sendEmailAlert = async () => {
    return new Promise(function(resolve, reject) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_PASSWORD,
            },
        });
        let mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: 'agordon@hutsoninc.com',
            subject: 'HubSpot Import Server Error',
            html: 'Excel process needs to be started.',
        };
        transporter.sendMail(mailOptions, function(err, info) {
            if (err) reject(err);
            resolve(info);
        });
    });
};

const run = async options => {
    options = Object.assign(
        {
            customers: {
                input: path.join(__dirname, '../data/customers.csv'), // Data from query
                previousImport: path.join(
                    __dirname,
                    '../data/customers-out.json'
                ), // Previous import data
            },
            deals: {
                input: path.join(__dirname, '../data/deals.csv'), // Data from query
                previousImport: path.join(__dirname, '../data/deals-out.json'), // Previous import data
            },
            parts: {
                input: path.join(__dirname, '../data/parts.csv'), // Data from query
                previousImport: path.join(__dirname, '../data/parts-out.json'), // Previous import data
            },
            upload: true, // Should the new data be uploaded to HubSpot
            limit: 5, // Number of concurrent executions
        },
        options
    );

    console.log('Checking for excel process...');
    let running = await isRunning('wfica32.exe').catch(err => {
        console.log(err);
        process.exit(1);
    });

    if (!running) {
        console.log('Excel process is not running.');
        console.log('Sending email alert...');
        await sendEmailAlert()
            .then(() => {
                console.log('Sent email alert');
                process.exit(0);
            })
            .catch(err => {
                console.log(err);
            });
        process.exit(0);
    }

    console.log('Excel process is running.');
    const userprofile = process.env.USERPROFILE;

    // Copy current excel files
    console.log('Copying excel files from query...');
    await fs.copyFile(
        `${userprofile}/OneDrive - Hutson, Inc/data/customers.csv`,
        `${userprofile}/projects/data/customers.csv`
    );
    await fs.copyFile(
        `${userprofile}/OneDrive - Hutson, Inc/data/deals.csv`,
        `${userprofile}/projects/data/deals.csv`
    );
    await fs.copyFile(
        `${userprofile}/OneDrive - Hutson, Inc/data/parts.csv`,
        `${userprofile}/projects/data/parts.csv`
    );

    // Import customers
    console.log('Importing customers...');
    let input = fs.readFileSync(options.customers.input, 'utf8');
    // Read CSV and convert to JSON
    let customersData = await csv().fromString(input);
    // Scrub data
    customersData = scrubCustomers(customersData);

    // Import deals
    console.log('Importing deals...');
    input = fs.readFileSync(options.deals.input, 'utf8');
    // Read CSV and convert to JSON
    let dealsData = await csv().fromString(input);
    // Scrub data
    dealsData = scrubDeals(dealsData);
    // Filter out deals without a customer record
    let customerCodes = customersData.map(customer =>
        customer.customer_code.toUpperCase()
    );
    dealsData = dealsData.filter(obj => {
        if (
            obj.customer_code &&
            customerCodes.indexOf(obj.customer_code.toUpperCase()) >= 0
        ) {
            return true;
        }
        return false;
    });

    // Import parts
    console.log('Importing parts...');
    input = fs.readFileSync(options.parts.input, 'utf8');
    // Read CSV and convert to JSON
    let partsData = await csv().fromString(input);
    // Scrub data
    partsData = scrubParts(partsData);
    // Filter out parts without a customer record
    let accountNumbers = customersData
        .map(obj => {
            if (obj.customer_account_number) {
                return Number(obj.customer_account_number);
            }
            return null;
        })
        .filter(obj => obj !== null);

    partsData = partsData
        .map(part => {
            if (accountNumbers.indexOf(part.customer_account_number) >= 0) {
                return part;
            }
            return null;
        })
        .filter(obj => obj !== null);

    // Filter out customers from previous import
    console.log('Filtering customers from previous import...');
    let previousCustomersImport = fs.readFileSync(
        options.customers.previousImport,
        'utf8'
    );
    previousCustomersImport = JSON.parse(previousCustomersImport);
    let newCustomersData = customersData
        .map(customer => {
            // Find customer in previous import
            let record = previousCustomersImport.find(obj => {
                if (obj && customer) {
                    return obj.customer_code === customer.customer_code;
                } else {
                    return false;
                }
            });
            if (record && isEqualObj(customer, record)) {
                // Customer found in previous import and data hasn't changed
                return null;
            }
            return customer;
        })
        .filter(obj => obj !== null);

    console.log(newCustomersData.length + ' customers.');

    // Filter out deals from previous import
    console.log('Filtering deals from previous import...');
    let previousDealsImport = fs.readFileSync(
        options.deals.previousImport,
        'utf8'
    );
    previousDealsImport = JSON.parse(previousDealsImport);
    let newDealsData = dealsData
        .map(deal => {
            let record = previousDealsImport.find(obj => {
                if (obj && deal) {
                    return obj.stock_number === deal.stock_number;
                } else {
                    return false;
                }
            });
            if (record) {
                // Deal found in previous import
                return null;
            }
            return deal;
        })
        .filter(obj => obj !== null);

    console.log(newDealsData.length + ' deals.');

    // Filter out parts from previous import
    console.log('Filtering parts from previous import...');
    let previousPartsImport = fs.readFileSync(
        options.parts.previousImport,
        'utf8'
    );
    previousPartsImport = JSON.parse(previousPartsImport);
    let newPartsData = partsData
        .map(part => {
            let record = previousPartsImport.find(obj => {
                if (obj && part) {
                    return obj.transaction_id === part.transaction_id;
                } else {
                    return false;
                }
            });
            if (record) {
                // Part found in previous import
                return null;
            }
            return part;
        })
        .filter(obj => obj !== null);

    console.log(newPartsData.length + ' parts.');

    // Merge data for upload
    console.log('Merging customer data for upload...');
    newCustomersData = newCustomersData.map(customer => {
        let out = {
            email: customer.email,
            phone: customer.phone,
            mobilephone: customer.mobilephone,
            state: customer.state,
            zip: customer.zip,
            branch: customer.branch,
            customer_code: customer.customer_code,
            customer_account_number: customer.customer_account_number,
            address: customer.address,
            city: customer.city,
            firstname: '',
            lastname: '',
            company: '',
        };

        let deals = newDealsData.filter(
            obj =>
                obj.customer_code.toUpperCase() ===
                customer.customer_code.toUpperCase()
        );

        deals.forEach(deal => {
            if (out.phone === '') {
                out.phone = deal.phone;
            }
            if (out.mobilephone === '') {
                out.mobilephone = deal.mobilephone;
            }
            if (out.state === '') {
                out.state = deal.state;
            }
            if (out.zip === '') {
                out.zip = deal.zip;
            }
            if (out.branch === '') {
                out.branch = deal.branch;
            }
            if (out.firstname === '') {
                out.firstname = deal.firstname;
            }
            if (out.lastname === '') {
                out.lastname = deal.lastname;
            }
            if (out.address === '') {
                out.address = deal.address;
            }
            if (out.city === '') {
                out.city = deal.city;
            }
            if (out.company === '') {
                out.company = deal.company;
            }
        });

        out = removeEmptyValues(out);

        return out;
    });

    // Upload customers to HubSpot
    console.log('Uploading customers to HubSpot...');
    let customerErrors = await uploadCustomers(newCustomersData, options);
    fs.writeFileSync(
        `${userprofile}/projects/data/logs/customer-errors-${Date.now()}.json`,
        JSON.stringify(customerErrors)
    );

    // Fetch HubSpot contacts for associations
    console.log(
        `Fetching customer VIDs...`
    );
    let hubspotCustomers = await fetchHubspotCustomers();

    hubspotCustomers = hubspotCustomers
        .map(obj => {
            let customerCode = obj.properties.customer_code;
            let customerAccountNumber = obj.properties.customer_account_number;
            if (!customerCode || !customerAccountNumber) {
                return null;
            }
            return {
                customer_account_number: customerAccountNumber.value,
                customer_code: customerCode.value,
                vid: obj.vid,
            };
        })
        .filter(obj => obj !== null);

    // Match contact VIDs to deals for associations
    console.log('Associating contacts with deals...');
    newDealsData = newDealsData
        .map(deal => {
            let customer = hubspotCustomers.find(
                customer =>
                    customer.customer_code.toUpperCase() ===
                    deal.customer_code.toUpperCase()
            );
            if (customer) {
                let out = {
                    properties: {
                        pipeline: deal.pipeline,
                        dealstage: deal.dealstage,
                        dealname: deal.dealname,
                        amount: Number(deal.amount),
                        closedate: deal.closedate,
                        vin_number: deal.vin_number,
                        stock_number: deal.stock_number,
                        equipment_make: deal.equipment_make,
                        equipment_model: deal.equipment_model,
                        equipment_category: deal.equipment_category,
                        equipment_subcategory: deal.equipment_subcategory,
                        new_or_used: deal.new_or_used,
                        year_manufactured: deal.year_manufactured,
                    },
                    associations: {
                        associatedVids: [customer.vid],
                    },
                };

                if (isNaN(out.amount)) {
                    out.amount = 0;
                }

                out = removeEmptyValues(out);

                return out;
            } else {
                return null;
            }
        })
        .filter(obj => obj !== null);

    // Upload deals to HubSpot
    console.log('Uploading deals to HubSpot...');
    let dealErrors = await uploadDeals(newDealsData, options);
    fs.writeFileSync(
        `${userprofile}/projects/data/logs/deal-errors-${Date.now()}.json`,
        JSON.stringify(dealErrors)
    );

    // Match contact VIDs to parts for associations
    console.log('Associating contacts with parts...');
    newPartsData = newPartsData
        .map(part => {
            let customer = hubspotCustomers.find(
                customer =>
                    Number(customer.customer_account_number) ===
                    Number(part.customer_account_number)
            );
            if (customer) {
                let out = {
                    properties: {
                        quantity: part.quantity,
                        branch: part.branch,
                        part_franchise: part.part_franchise,
                        part_number: part.part_number,
                        closedate: part.closedate,
                        part_list_price: part.part_list_price,
                        amount: part.amount,
                        online_order: part.online_order,
                        transaction_id: part.transaction_id,
                        dealname: part.dealname,
                        dealstage: part.dealstage,
                        pipeline: part.pipeline,
                    },
                    associations: {
                        associatedVids: [customer.vid],
                    },
                };

                out = removeEmptyValues(out);

                return out;
            } else {
                return null;
            }
        })
        .filter(obj => obj !== null);

    // Upload parts to HubSpot
    console.log('Uploading parts to HubSpot...');
    let partErrors = await uploadParts(newPartsData, options);
    fs.writeFileSync(
        `${userprofile}/projects/data/logs/part-errors-${Date.now()}.json`,
        JSON.stringify(partErrors)
    );

    // Save imports
    if (options.upload) {
        console.log('Saving import data...');
        fs.writeFileSync(
            options.customers.previousImport,
            JSON.stringify(customersData)
        );
        fs.writeFileSync(
            options.deals.previousImport,
            JSON.stringify(dealsData)
        );
        fs.writeFileSync(
            options.parts.previousImport,
            JSON.stringify(partsData)
        );
    }

    // Create backups
    console.log('Creating backups...');
    await fs.copyFile(
        `${userprofile}/projects/data/customers-out.json`,
        `${userprofile}/projects/data/backups/customers-out-${Date.now()}.json`
    );
    await fs.copyFile(
        `${userprofile}/projects/data/deals-out.json`,
        `${userprofile}/projects/data/backups/deals-out-${Date.now()}.json`
    );
    await fs.copyFile(
        `${userprofile}/projects/data/parts-out.json`,
        `${userprofile}/projects/data/backups/parts-out-${Date.now()}.json`
    );
};

run()
    .then(() => {
        console.log('Finished!');
        process.exit(0);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
