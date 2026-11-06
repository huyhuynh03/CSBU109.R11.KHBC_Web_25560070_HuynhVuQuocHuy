// Money helpers.
// DECIMAL(12,2) is returned as a JS number here, so every calculation is done in
// "cents" and converted back at the end. That keeps 0.1 + 0.2 from becoming
// 0.30000000000000004 inside total_amount.
const toCents = (value) => Math.round(Number(value) * 100);
const toAmount = (cents) => Number((cents / 100).toFixed(2));

module.exports = { toCents, toAmount };
