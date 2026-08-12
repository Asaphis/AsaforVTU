const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the backend/.env file
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const pool = require('../src/config/database');
const flutterwaveService = require('../src/services/flutterwaveService');
const walletService = require('../src/services/walletService');

async function reprocessPayment(tx_ref_or_id) {
  if (!tx_ref_or_id) {
    console.error('Please provide a transaction reference or ID as an argument.');
    process.exit(1);
  }

  console.log(`Starting reprocessing for: ${tx_ref_or_id}`);

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Try to find the payment in PostgreSQL
    let paymentResult = await client.query(
      'SELECT * FROM payments WHERE tx_ref = $1 OR provider_reference = $1 LIMIT 1',
      [tx_ref_or_id]
    );
    
    let userId;
    let amount;
    
    if (paymentResult.rows.length > 0) {
      const payment = paymentResult.rows[0];
      userId = payment.user_id;
      amount = payment.amount;
      console.log(`Found existing payment record. User ID: ${userId}, Status: ${payment.status}`);
      
      if (payment.status === 'success') {
        console.log('Payment is already marked as success in the database.');
        await client.query('ROLLBACK');
        client.release();
        process.exit(0);
      }
    } else {
      console.log('Payment record not found in local DB. Will attempt to verify with Flutterwave directly.');
    }

    // 2. If we don't have userId or amount, fetch from Flutterwave
    if (!userId || !amount) {
      console.log('Fetching details from Flutterwave...');
      let verifyData;
      try {
        if (String(tx_ref_or_id).match(/^\d+$/)) {
          verifyData = await flutterwaveService.verifyById(tx_ref_or_id);
        } else {
          verifyData = await flutterwaveService.verifyByReference(tx_ref_or_id);
        }
      } catch (e) {
        console.error('Failed to verify with Flutterwave:', e.message);
        await client.query('ROLLBACK');
        client.release();
        process.exit(1);
      }

      if (verifyData.status !== 'success') {
        console.error('Flutterwave says transaction is not successful:', verifyData);
        await client.query('ROLLBACK');
        client.release();
        process.exit(1);
      }

      const data = verifyData.data;
      amount = data.amount;
      
      // Try to get userId from meta
      if (!userId && data.meta && data.meta.userId) {
        userId = data.meta.userId;
        console.log(`Retrieved User ID from Flutterwave meta: ${userId}`);
      }
    }

    if (!userId) {
      console.error('CRITICAL: Could not determine User ID for this transaction. Cannot credit wallet.');
      await client.query('ROLLBACK');
      client.release();
      process.exit(1);
    }

    console.log(`Verifying and Crediting... User: ${userId}, Amount: ${amount}`);
    
    await client.query('COMMIT');
    client.release();
    
    // Now call the service to verify and credit (it will use its own transaction)
    const result = await flutterwaveService.creditIfValid(tx_ref_or_id, amount, userId);
    
    if (result.success) {
      console.log('SUCCESS! User wallet has been credited.');
      console.log('Result:', result);
    } else {
      console.error('FAILED. The transaction could not be credited.');
      console.error('Result:', result);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('An error occurred:', error);
  } finally {
    process.exit(0);
  }
}

const args = process.argv.slice(2);
reprocessPayment(args[0]);
