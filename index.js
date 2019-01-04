'use strict';
require('dotenv').config();
const nodemailer = require('nodemailer');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');

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
		console.log('Excel process is running.');
        const userprofile = process.env.USERPROFILE;

        // Copy current excel files
		console.log('Copying excel files from query...');
        await fs.copyFile(`${userprofile}/OneDrive - Hutson, Inc/data/customers.csv`, `${userprofile}/projects/data/customers.csv`);
        // await fs.copyFile(`${userprofile}/OneDrive - Hutson, Inc/data/deals.csv`, `${userprofile}/projects/data/deals.csv`);

        // Import customers
		console.log('Running customers import...');
        await runNode(path.join(__dirname, '/src/customers.js'));
        
        // Import deals
		// console.log('Running deals import...');
        // await runNode(path.join(__dirname, '/src/deals.js'));

        // Create backups
		console.log('Creating backups...');
        await fs.copyFile(`${userprofile}/projects/data/customers-out.json`, `${userprofile}/projects/data/backups/customers-out-${Date.now()}.json`);
        // await fs.copyFile(`${userprofile}/projects/data/deals-out.json`, `${userprofile}/projects/data/backups/deals-out-${Date.now()}.json`);
    }

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