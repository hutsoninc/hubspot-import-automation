const { validateHutsonBranch } = require('@hutsoninc/data-scrubber');

module.exports = function scrub(data) {
    console.log('Scrubbing ' + data.length + ' records...');

    data = data
        .map(obj => {
            let out = {};

            // Quantity
            out.quantity = Number(obj.QTY);
            if (out.quantity <= 0) {
                return null;
            }

            // Hutson Branch
            out.branch = validateHutsonBranch(obj.BRANCH);

            // Part Franchise
            out.part_franchise = String(obj.FRANCHISE).trim();

            // Part Number
            out.part_number = String(obj.PART_NO).trim();

            // Close Date
            out.closedate = Date.parse(obj.Trans_Datetime);

            // Customer Account Number
            out.customer_account_number = Number(obj.customer_no);
            if (isNaN(out.customer_account_number)) {
                return null;
            }

            // List Price
            out.part_list_price = Number(obj.LIST_PRICE);

            // Sale Amount
            out.amount = Number(obj.LIST_PRICE) * Number(obj.QTY) || 0;

            // Online Order
            out.online_order = obj.Online_Order;

            // Transaction ID
            out.transaction_id = obj.trans_id;

            out.dealname = `${out.part_number} - ${out.transaction_id}`;
            out.dealstage = '7764f9f7-3ec5-4e1f-a78b-400612ce5f90';
            out.pipeline = '86c7aeff-6e43-489e-825c-8175a137a679';

            return out;
        })
        .filter(obj => obj !== null);

    return data;
};
