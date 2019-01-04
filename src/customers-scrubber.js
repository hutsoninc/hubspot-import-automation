const { validatePhone, validateEmail, validateZip, validateState, validateHutsonBranch } = require('@hutsoninc/data-scrubber');

module.exports = function scrub(data) {

    console.log('Scrubbing ' + data.length + ' records');

    data = data.map(row => {

        obj = Object.assign({}, row);

        let out = {};

        // Email
        out.email = validateEmail(obj.Email, 'email');
        delete obj.Email;

        // If no email, remove customer
        if (out.email === '') {
            return null;
        }

        // Phone Number
        out.phone = validatePhone(obj.HomePhone, 'phone');
        delete obj.HomePhone;

        // Business Phone Number
        out.businessPhone = validatePhone(obj.BusinessPhone, 'business-phone');
        delete obj.BusinessPhone;

        // Mobile Phone Number
        out.mobilephone = validatePhone(obj.MobilePhone, 'mobile');
        delete obj.MobilePhone;

        // State
        out.state = validateState(obj.State, 'state');
        delete obj.State;

        // Zip
        out.zip = validateZip(obj.ZIP, 'zip');
        delete obj.ZIP;

        // Hutson Branch
        out.branch = validateHutsonBranch(obj.Territory, 'hutson-branch');
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

        if (obj.businessPhone) {
            obj.phone = obj.businessPhone;
        }
        delete obj.businessPhone;

        return obj;
    });

    return data;

}