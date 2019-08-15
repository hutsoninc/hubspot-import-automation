const {
    validatePhone,
    validateEmail,
    validateZip,
    validateState,
    validateHutsonBranch,
} = require('@hutsoninc/data-scrubber');

const scrubCustomers = data => {
    console.log('Scrubbing ' + data.length + ' records...');

    const cleanData = data.reduce((acc, obj) => {
        const email = validateEmail(obj.Email);

        // If no email, remove customer
        if (email === '') {
            return acc;
        }

        let phone = validatePhone(obj.HomePhone);
        const businessphone = validatePhone(obj.BusinessPhone);
        const mobilephone = validatePhone(obj.MobilePhone);

        if (!phone) {
            if (businessphone) {
                phone = businessphone;
            } else if (mobilephone) {
                phone = mobilephone;
            }
        }

        const state = validateState(obj.State);
        const zip = validateZip(obj.ZIP);
        const branch = validateHutsonBranch(obj.Territory);
        const customer_code = String(obj.CustomerCode).trim();
        const customer_account_number = Number(obj.AccountNumber);
        const address = String(obj.Address1).trim();
        const city = String(obj.City).trim();

        acc.push({
            email,
            phone,
            mobilephone,
            state,
            zip,
            branch,
            customer_code,
            customer_account_number,
            address,
            city,
        });

        return acc;
    }, []);

    return cleanData;
};

module.exports = scrubCustomers;
