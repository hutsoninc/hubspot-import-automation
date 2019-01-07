const { validatePhone, validateEmail, validateZip, validateState, validateHutsonBranch } = require('@hutsoninc/data-scrubber');

module.exports = function scrub(data) {

    console.log('Scrubbing ' + data.length + ' records');

    data = data.map(row => {

        obj = Object.assign({}, row);

        let out = {};

        // Email
        out.email = validateEmail(obj.Email);
        delete obj.Email;

        // If no email, remove customer
        if (out.email === '') {
            return null;
        }

        // Phone Number
        out.phone = validatePhone(obj.HomePhone);
        delete obj.HomePhone;

        // Business Phone Number
        out.businessphone = validatePhone(obj.BusinessPhone);
        delete obj.BusinessPhone;

        // Mobile Phone Number
        out.mobilephone = validatePhone(obj.MobilePhone);
        delete obj.MobilePhone;

        // State
        out.state = validateState(obj.State);
        delete obj.State;

        // Zip
        out.zip = validateZip(obj.ZIP);
        delete obj.ZIP;

        // Hutson Branch
        out.branch = validateHutsonBranch(obj.Territory);
        delete obj.Territory;

        // Customer Code
        out.customer_code = String(obj.CustomerCode).trim();
        delete obj.CustomerCode;

        // Address
        out.address = String(obj.Address1).trim();
        delete obj.Address1;

        // City
        out.city = String(obj.City).trim();
        delete obj.City;

        return out;

    });

    data = data.filter(obj => obj);

    data = data.map(row => {

        obj = Object.assign({}, row);

        if (obj.businessphone) {
            obj.phone = obj.businessphone;
        }
        delete obj.businessphone;

        return obj;
    });

    return data;

}