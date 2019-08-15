const path = require('path');

const defaultOptions = {
    customers: {
        input: path.join(__dirname, '../data/customers.csv'), // Data from query
        previousImport: path.join(__dirname, '../data/customers-out.json'), // Previous import data
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
};

module.exports = defaultOptions;
