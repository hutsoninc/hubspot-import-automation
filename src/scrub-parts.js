const { validateHutsonBranch } = require('@hutsoninc/data-scrubber');

const scrubParts = data => {
    console.log('Scrubbing ' + data.length + ' records...');

    const cleanData = data.reduce((acc, obj) => {
        const quantity = Number(obj.QTY);

        if (quantity <= 0) {
            return acc;
        }

        const customer_account_number = Number(obj.customer_no);

        if (isNaN(customer_account_number)) {
            return acc;
        }

        const branch = validateHutsonBranch(obj.BRANCH);
        const part_franchise = String(obj.FRANCHISE).trim();
        const part_number = String(obj.PART_NO).trim();
        const closedate = Date.parse(obj.Trans_Datetime);
        const part_list_price = Number(obj.LIST_PRICE);
        const amount = Number(obj.LIST_PRICE) * Number(obj.QTY) || 0;
        const online_order = obj.Online_Order;
        const transaction_id = obj.trans_id;
        const dealname = `${part_number} - ${transaction_id}`;
        const dealstage = '7764f9f7-3ec5-4e1f-a78b-400612ce5f90';
        const pipeline = '86c7aeff-6e43-489e-825c-8175a137a679';

        acc.push({
            quantity,
            customer_account_number,
            branch,
            part_franchise,
            part_number,
            closedate,
            part_list_price,
            amount,
            online_order,
            transaction_id,
            dealname,
            dealstage,
            pipeline,
        });

        return acc;
    }, []);

    return cleanData;
};

module.exports = scrubParts;
