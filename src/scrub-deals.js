const {
    validatePhone,
    validateEmail,
    validateZip,
    validateState,
    validateHutsonBranch,
} = require('@hutsoninc/data-scrubber');
const { toTitleCase } = require('./utils');

const scrubDeals = data => {
    console.log('Scrubbing ' + data.length + ' records...');

    const cleanData = data.reduce((acc, obj) => {
        const email = validateEmail(obj.contact_email_address);
        const mobilephone = validatePhone(obj.contact_mob_phone);
        const state = validateState(obj.contact_state);
        const zip = validateZip(obj.contact_pcode);
        const branch = validateHutsonBranch(obj.vhstock_br);
        const firstname = toTitleCase(obj.contact_name);
        const lastname = toTitleCase(obj.contact_surname);
        const customer_code = String(obj.contact_code).trim();
        const address = String(obj.contact_street).trim();
        const city = String(obj.contact_city).trim();
        const stock_number = String(obj.vhstock_no).trim();
        const equipment_make = String(obj.vhstock_make).trim();
        const equipment_model = String(obj.vhstock_model).trim();
        const equipment_category = String(obj.vhstock_variant).trim();
        const new_or_used = String(obj.vhstock_type).trim();
        const equipment_subcategory = String(obj.vhstock_category).trim();
        const vin_number = String(obj.vhstock_vin_no).trim();
        const year_manufactured = String(obj.vhstock_year_manuf).trim();
        const closedate = Date.parse(obj.vhstock_salesdate);
        const company = String(obj.contact_company_name).trim();
        const amount = String(obj.vhstock_sales_value).trim();
        const dealstage = 'closedwon';
        const pipeline = 'default';

        let phone = '';

        if (obj.contact_country === 'US') {
            phone = validatePhone(obj.contact_bus_phone);
        }

        let dealname = '';

        if (year_manufactured) {
            dealname += `${year_manufactured} `;
        }

        if (equipment_make) {
            dealname += `${equipment_make} `;
        }

        if (equipment_model) {
            dealname += equipment_model;
        }

        if (firstname) {
            dealname += ` - ${firstname}`;

            if (lastname) {
                dealname += ` ${lastname}`;
            }
        }

        acc.push({
            email,
            phone,
            mobilephone,
            state,
            zip,
            branch,
            firstname,
            lastname,
            customer_code,
            address,
            city,
            stock_number,
            equipment_make,
            equipment_model,
            equipment_category,
            new_or_used,
            equipment_subcategory,
            vin_number,
            year_manufactured,
            closedate,
            company,
            amount,
            dealstage,
            pipeline,
            dealname,
        });

        return acc;
    }, []);

    return cleanData;
};

module.exports = scrubDeals;
