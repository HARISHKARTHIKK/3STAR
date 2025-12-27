import { db } from './firebase.js';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export const seedDatabase = async () => {
    try {
        // 1. Seed Company Settings with exact details from the prompt
        await setDoc(doc(db, 'settings', 'global'), {
            companyName: '3 STAR PEST CONTROL',
            address: '39, Gandhi Road, Srirangam, Trichy-620006',
            mobile: '98424 74442',
            msmeNumber: 'UDYAM-TN-27-00XXXXX', // Placeholder MSME if not provided, but field exists
            email: '3starpestcontrol@gmail.com',
            bankDetails: {
                bankName: 'City Union Bank',
                branch: 'Srirangam Branch',
                accountNumber: '500101011051515',
                ifscCode: 'CIUB0000021',
                accountName: '3 STAR PEST CONTROL'
            }
        });

        console.log('Company settings updated.');
        alert('Settings Updated! You can now generate invoices.');
    } catch (error) {
        console.error("Error seeding database:", error);
        alert('Error: ' + error.message);
    }
};
