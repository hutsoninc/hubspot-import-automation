'use strict';
require('dotenv').config();
const nodemailer = require('nodemailer');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');
const fetchHubspotCustomer = require('./src/fetch-hubspot-customers');
const scrubCustomers = require('./src/customers-scrubber');
const scrubDeals = require('./src/deals-scrubber');
const csv = require('csvtojson');
const Promise = require('bluebird');
const uploadCustomers = require('./src/customers');
const uploadDeals = require('./src/deals');
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
            html: 'Please fix me',
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
            upload: true, // Should the new data be uploaded to HubSpot
            limit: 5, // Number of concurrent executions
        },
        options
    );

    console.log('Checking for excel process...');
    let running = await isRunning('wfica32.exe').catch(err => {
        console.error(err);
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
                console.error(err);
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

    // Merge data for upload
    console.log('Merging data for upload...');
    newCustomersData = newCustomersData.map(customer => {
        let out = {
            email: customer.email,
            phone: customer.phone,
            mobilephone: customer.mobilephone,
            state: customer.state,
            zip: customer.zip,
            branch: customer.branch,
            customer_code: customer.customer_code,
            address: customer.address,
            city: customer.city,
            firstname: '',
            lastname: '',
            company_name: '',
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
            if (out.company_name === '') {
                out.company_name = deal.company_name;
            }
        });

        out = removeEmptyValues(out);

        return out;
    });

    // Fetch HubSpot contacts for deal associations
    let hubspotCustomers = await fetchHubspotCustomer();

    hubspotCustomers = hubspotCustomers
        .map(obj => {
            let customerCode = obj.properties.customer_code;
            if (customerCode) {
                return {
                    customer_code: customerCode.value,
                    vid: obj.vid,
                };
            }
            return null;
        })
        .filter(obj => obj !== null);

    // Match contact VIDs to deals for associations
    console.log(
        `Fetching customer VIDs for ${newDealsData.length} deal associations...`
    );
    newDealsData = newDealsData
        .map(deal => {
            let customer = hubspotCustomers.find(
                customer =>
                    customer.customer_code.toUpperCase() ===
                    deal.customer_code.toUpperCase()
            );
            if (customer) {
                let out = {
                    pipeline: deal.pipeline,
                    dealstage: deal.dealstage,
                    dealname: deal.dealname,
                    amount: deal.amount,
                    closedate: deal.closedate,
                    vin_number: deal.vin_number,
                    stock_number: deal.stock_number,
                    equipment_make: deal.equipment_make,
                    equipment_model: deal.equipment_model,
                    equipment_category: deal.equipment_category,
                    equipment_subcategory: deal.equipment_subcategory,
                    new_or_used: deal.new_or_used,
                    year_manufactured: deal.year_manufactured,
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

    // Upload data to HubSpot
    console.log('Uploading data to HubSpot...');
    await uploadCustomers(newCustomersData, options);
    await uploadDeals(newDealsData, options);

    // Save imports
    fs.writeFileSync(
        options.customers.previousImport,
        JSON.stringify(customersData)
    );
    fs.writeFileSync(options.deals.previousImport, JSON.stringify(dealsData));

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
};

run()
    .then(() => {
        console.log('Finished!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
