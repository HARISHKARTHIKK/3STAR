const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// 1. Path to your Firebase Service Account key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. CSV file processing
const csvFilePath = 'customers.csv';

if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: ${csvFilePath} not found. Please place your CSV file in the root directory.`);
    process.exit(1);
}

// Helper to clean price strings (removes Rs., symbols, etc.)
const cleanNumber = (val) => {
    if (!val) return 0;
    // User requested regex: .replace(/[^0-9.-]+/g,"")
    const cleaned = val.toString().replace(/[^0-9.-]+/g, "");
    return Number(cleaned) || 0;
};

console.log('Migrating customers with exact Excel header mapping...');

fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
        // Mapping based on USER requested Excel Headers
        const name = row['Customer Name'] || 'N/A';
        const address = row['Address'] || 'N/A';
        const rate = cleanNumber(row['Rate/Amount']);
        const services_count = cleanNumber(row['Quantity/Services']) || 1;
        const contact = row['Phone/Contact'] || '';

        // We still need a bill number for the invoice logic
        const last_inv_no = Number(row['BILL Number:']) || 0;

        db.collection('Customers').add({
            name,
            address,
            rate,
            services_count,
            contact,
            last_inv_no,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
            .then(() => console.log(`✅ Added: ${name} | Rate: ${rate} | Qty: ${services_count}`))
            .catch((err) => console.error(`❌ Error adding ${name}: `, err));
    })
    .on('end', () => {
        console.log('CSV data mapping logic completed!');
    });
