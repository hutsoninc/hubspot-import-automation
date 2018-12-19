'use strict';
require('dotenv').config();
const nodemailer = require('nodemailer');
const exec = require('child_process').exec;
const fs = require('fs-extra');

const isRunning = async query => {
    return new Promise(function (resolve, reject) {
        exec('tasklist', (err, stdout, stderr) => {
            if (err) reject(err);
            if (stderr) reject(stderr);
            resolve(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
        });
    });
};

const runNode = async args => {
    return new Promise(function (resolve, reject) {
        if (args) {
            if (Array.isArray(args)) {
                args = args.join(' ');
            } else if (typeof args !== 'string') {
                reject('Invalid args');
            }
        }
        exec(`node ${args}`, (err, stdout, stderr) => {
            if (err) reject(err);
            if (stderr) reject(stderr);
            resolve(stdout);
        });
    });
};

const sendEmailAlert = async () => {
    return new Promise(function (resolve, reject) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_PASSWORD
            }
        });
        let mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: 'agordon@hutsoninc.com',
            subject: 'HubSpot Import Server Error',
            html: 'Please fix me'
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) reject(err);
            resolve(info);
        });
    });
};

const run = async () => {

	console.log('Checking for excel process...');
    let running = await isRunning('wfica32.exe')
        .catch(err => {
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
    } else {
		onsole.log('Excel process is running.');
        const userprofile = process.env.USERPROFILE;

        // Copy current excel files
		console.log('Copying excel files...');
        await fs.copyFile(`${userprofile}/OneDrive - Hutson, Inc/data/customers.csv`, `${userprofile}/projects/data/customers.csv`);
        await fs.copyFile(`${userprofile}/OneDrive - Hutson, Inc/data/deals.csv`, `${userprofile}/projects/data/deals.csv`);

        // Clean and validate customer data
		console.log('Running customer data scrubber...');
        let scrubberLogsCustomers = await runNode(`${userprofile}/projects/data-scrubber/scripts/customers.js`);
        console.log(scrubberLogsCustomers);
        
        // Clean and validate deals data
		console.log('Running deals data scrubber...');
        let scrubberLogsDeals = await runNode(`${userprofile}/projects/data-scrubber/scripts/deals.js`);
		console.log(scrubberLogsDeals);
        
        // Filter deals data
		console.log('Running deals data filter...');
        let filterLogsDeals = await runNode(`${userprofile}/projects/data-scrubber/scripts/filter-deals.js`);
		console.log(filterLogsDeals);

        // Upload customers to HubSpot
		console.log('Uploading customers to HubSpot...');
        let importLogsCustomers = await runNode(`${userprofile}/projects/hubspot-import-automation/src/customers.js`);
		console.log(importLogsCustomers);

        // Upload deals to HubSpot
		console.log('Uploading deals to HubSpot...');
        let importLogsDeals = await runNode(`${userprofile}/projects/hubspot-import-automation/src/deals.js`);
		console.log(importLogsDeals);

        // Copy new data for next comparison
		console.log('Copy files for next run...');
        await fs.move(`${userprofile}/projects/data/customers-old.json`, `${userprofile}/projects/data/backups/customers-old-${Date.now()}.json`);
        await fs.move(`${userprofile}/projects/data/customers-out.json`, `${userprofile}/projects/data/customers-old.json`);
        await fs.move(`${userprofile}/projects/data/deals-old.json`, `${userprofile}/projects/data/backups/deals-old-${Date.now()}.json`);
        await fs.move(`${userprofile}/projects/data/deals-out.json`, `${userprofile}/projects/data/deals-old.json`);
    }

};


run()
    .then(() => {
		console.log('Finished!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
    });