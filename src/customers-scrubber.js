const {
    validatePhone,
    validateEmail,
    validateZip,
    validateState,
    validateHutsonBranch,
} = require('@hutsoninc/data-scrubber');

module.exports = function scrub(data) {
    console.log('Scrubbing ' + data.length + ' records...');

    data = data
        .map(obj => {
            let out = {};

            // Email
            out.email = validateEmail(obj.Email);

            // If no email, remove customer
            if (out.email === '') {
                return null;
            }

            // Phone Number
            out.phone = validatePhone(obj.HomePhone);

            // Business Phone Number
            out.businessphone = validatePhone(obj.BusinessPhone);

            // Mobile Phone Number
            out.mobilephone = validatePhone(obj.MobilePhone);

            // State
            out.state = validateState(obj.State);

            // Zip
            out.zip = validateZip(obj.ZIP);

            // Hutson Branch
            out.branch = validateHutsonBranch(obj.Territory);

            // Customer Code
            out.customer_code = String(obj.CustomerCode).trim();

            // Customer Account Number
            out.customer_account_number = Number(obj.AccountNumber);

            // Address
            out.address = String(obj.Address1).trim();

            // City
            out.city = String(obj.City).trim();

            return out;
        })
        .filter(obj => obj);

    data = data.map(obj => {
        if (obj.businessphone) {
            obj.phone = obj.businessphone;
        }
        delete obj.businessphone;

        return obj;
    });

    return data;
};
