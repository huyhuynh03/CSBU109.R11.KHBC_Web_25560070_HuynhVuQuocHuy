/**
 * Homework 3 (Set A): Reading Invoice Data from invoices.json,
 * Validating It, and Syncing It into MongoDB via the Invoice Mongoose Model
 *
 * 1. Doc invoices.json (mang invoices)
 * 2. Schema Invoice: required fields, email hop le, it nhat 1 item moi invoice,
 *    paymentMethod thuoc tap cho phep
 * 3. Validate + insert toan bo mang vao collection invoices qua model Invoice
 *
 * Chay: npm install && node homework_json_to_mongoose.js
 */
require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const ALLOWED_PAYMENTS = ['CreditCard', 'Momo', 'Cash', 'BankTransfer', 'ZaloPay'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const itemSchema = new mongoose.Schema(
  {
    productName: { type: String, required: [true, 'productName is required'] },
    quantity: { type: Number, required: [true, 'quantity is required'], min: [1, 'quantity >= 1'] },
    price: { type: Number, required: [true, 'price is required'], min: [0, 'price >= 0'] },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: { type: String, required: [true, 'invoiceCode is required'], unique: true },
    customerName: { type: String, required: [true, 'customerName is required'] },
    customerEmail: {
      type: String,
      required: [true, 'customerEmail is required'],
      match: [EMAIL_RE, 'customerEmail must be a valid email'],
    },
    items: {
      type: [itemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message: 'Each invoice must contain at least one item',
      },
    },
    paymentMethod: {
      type: String,
      required: [true, 'paymentMethod is required'],
      enum: {
        values: ALLOWED_PAYMENTS,
        message: `paymentMethod must be one of: ${ALLOWED_PAYMENTS.join(', ')}`,
      },
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

async function main() {
  const uri = process.env.MONGO_INVOICE_URI || 'mongodb://127.0.0.1:27017/invoice_db';
  const file = path.join(__dirname, 'invoices.json');

  const raw = await fs.readFile(file, 'utf8');
  const invoices = JSON.parse(raw);
  if (!Array.isArray(invoices)) throw new Error('invoices.json must contain an array');

  await mongoose.connect(uri);
  console.log('Connected:', uri);

  // Validate tung document truoc khi insert de bao loi chi tiet
  for (const doc of invoices) {
    await new Invoice(doc).validate();
  }

  const result = await Invoice.insertMany(invoices, { ordered: true });
  console.log(`Inserted ${result.length} invoice(s) into "invoices" collection.`);

  await mongoose.disconnect();
}

module.exports = { Invoice, ALLOWED_PAYMENTS };

if (require.main === module) {
  main().catch((e) => {
    console.error('Sync failed:', e.message);
    process.exit(1);
  });
}
