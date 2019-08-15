const nodemailer = require('nodemailer');
const exec = require('child_process').exec;
const Promise = require('bluebird');

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
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.GMAIL_EMAIL,
            to: 'agordon@hutsoninc.com',
            subject: 'HubSpot Import Server Error',
            html: 'Excel process needs to be started.',
        };
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) reject(err);
            resolve(info);
        });
    });
};

const checkProcess = async () => {
    console.log('Checking for excel process...');

    const running = await isRunning('wfica32.exe').catch(err => {
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
};

module.exports = checkProcess;
