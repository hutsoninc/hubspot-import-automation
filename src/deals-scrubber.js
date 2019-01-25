const {
    validatePhone,
    validateEmail,
    validateZip,
    validateState,
    validateHutsonBranch,
} = require('@hutsoninc/data-scrubber');
const { toTitleCase } = require('./utils');

module.exports = function scrub(data) {
    console.log('Scrubbing ' + data.length + ' records...');

    data = data
        .map(obj => {
            let out = {};

            // Email
            out.email = validateEmail(obj.contact_email_address);

            if (obj.contact_country === 'US') {
                // Phone Number
                out.phone = validatePhone(obj.contact_bus_phone);
            } else {
                out.phone = '';
            }

            // Mobile Phone Number
            out.mobilephone = validatePhone(obj.contact_mob_phone);

            // State
            out.state = validateState(obj.contact_state);

            // Zip
            out.zip = validateZip(obj.contact_pcode);

            // Hutson Branch
            out.branch = validateHutsonBranch(obj.vhstock_br);

            // First Name
            out.firstname = toTitleCase(String(obj.contact_name).trim());

            // Last Name
            out.lastname = toTitleCase(String(obj.contact_surname).trim());

            // Customer Code
            out.customer_code = String(obj.contact_code).trim();

            // Address
            out.address = String(obj.contact_street).trim();

            // City
            out.city = String(obj.contact_city).trim();

            // Stock Number
            out.stock_number = String(obj.vhstock_no).trim();

            // Make
            out.equipment_make = String(obj.vhstock_make).trim();

            // Model
            out.equipment_model = String(obj.vhstock_model).trim();

            // Category
            out.equipment_category = String(obj.vhstock_variant).trim();

            // New or Used
            out.new_or_used = String(obj.vhstock_type).trim();

            // Subcategory
            out.equipment_subcategory = String(obj.vhstock_category).trim();

            // VIN Number
            out.vin_number = String(obj.vhstock_vin_no).trim();

            // Year Manufactured
            out.year_manufactured = String(obj.vhstock_year_manuf).trim();

            // Sales Date
            out.closedate = Date.parse(obj.vhstock_salesdate);

            // Company Name
            out.company = String(obj.contact_company_name).trim();

            // Sales Value
            out.amount = String(obj.vhstock_sales_value).trim();

            out.dealstage = 'closedwon';
            out.pipeline = 'default';

            return out;
        })
        .filter(obj => obj);

    data = data.map(obj => {
        obj.dealname = `${
            obj.year_manufactured ? obj.year_manufactured + ' ' : ''
        }${obj.equipment_make ? obj.equipment_make + ' ' : ''}${
            obj.equipment_model ? obj.equipment_model : ''
        }${
            obj.firstname && obj.lastname
                ? ' - ' + obj.firstname + ' ' + obj.lastname
                : ''
        }`;

        return obj;
    });

    return data;
};
