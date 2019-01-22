const { validatePhone, validateEmail, validateZip, validateState, validateHutsonBranch } = require('@hutsoninc/data-scrubber');
const { toTitleCase } = require('./utils');

module.exports = function scrub(data) {

    console.log('Scrubbing ' + data.length + ' records...');

    data = data.map(row => {

        obj = Object.assign({}, row);

        let out = {};

        // Email
        out.email = validateEmail(obj.contact_email_address);
        delete obj.contact_email_address;

        if (obj.contact_country === "US") {
            // Phone Number
            out.phone = validatePhone(obj.contact_bus_phone);
        } else {
            out.phone = '';
        }
        delete obj.contact_bus_phone;
        delete obj.contact_country;

        // Mobile Phone Number
        out.mobilephone = validatePhone(obj.contact_mob_phone);
        delete obj.contact_mob_phone;

        // State
        out.state = validateState(obj.contact_state);
        delete obj.contact_state;

        // Zip
        out.zip = validateZip(obj.contact_pcode);
        delete obj.contact_pcode;

        // Hutson Branch
        out.branch = validateHutsonBranch(obj.vhstock_br);
        delete obj.vhstock_br;

        // First Name
        out.firstname = toTitleCase(String(obj.contact_name).trim());
        delete obj.contact_name;

        // Last Name
        out.lastname = toTitleCase(String(obj.contact_surname).trim());
        delete obj.contact_surname;

        // Customer Code
        out.customer_code = String(obj.contact_code).trim();
        delete obj.contact_code;

        // Address
        out.address = String(obj.contact_street).trim();
        delete obj.contact_street;

        // City
        out.city = String(obj.contact_city).trim();
        delete obj.contact_city;

        // Stock Number
        out.stock_number = String(obj.vhstock_no).trim();
        delete obj.vhstock_no;

        // Make
        out.equipment_make = String(obj.vhstock_make).trim();
        delete obj.vhstock_make;

        // Model
        out.equipment_model = String(obj.vhstock_model).trim();
        delete obj.vhstock_model;

        // Category
        out.equipment_category = String(obj.vhstock_variant).trim();
        delete obj.vhstock_variant;

        // New or Used
        out.new_or_used = String(obj.vhstock_type).trim();
        delete obj.vhstock_type;

        // Subcategory
        out.equipment_subcategory = String(obj.vhstock_category).trim();
        delete obj.vhstock_category;

        // VIN Number
        out.vin_number = String(obj.vhstock_vin_no).trim();
        delete obj.vhstock_vin_no;

        // Year Manufactured
        out.year_manufactured = String(obj.vhstock_year_manuf).trim();
        delete obj.vhstock_year_manuf;

        // Sales Date
        out.closedate = String(obj.vhstock_salesdate).trim();
        delete obj.vhstock_salesdate;

        // Company Name
        out.company_name = String(obj.contact_company_name).trim();
        delete obj.contact_company_name;

        // Sales Value
        out.amount = String(obj.vhstock_sales_value).trim();
        delete vhstock_sales_value

        out.dealstage = 'closedwon';
        out.pipeline = 'default';

        return out;

    });

    data = data.filter(obj => obj);

    data = data.map(row => {

        obj = Object.assign({}, row);

        obj.dealname = `${obj.year_manufactured ? obj.year_manufactured + ' ' : ''}${obj.equipment_make ? obj.equipment_make + ' ' : ''}${obj.equipment_model ? obj.equipment_model : ''}${(obj.firstname && obj.lastname) ? ' - ' + obj.firstname + ' ' + obj.lastname : ''}`;

        return obj;

    });

    return data;

}