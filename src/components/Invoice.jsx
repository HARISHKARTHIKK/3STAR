import React from 'react';
import { numberToWords } from '../utils/words';
import './Invoice.css';

const Invoice = ({ customer, date, serviceRange, settings, sequence }) => {
    const amount = (customer.services_count || 0) * (customer.rate || 0);

    // Helper to get Short Month Name (JAN, FEB, etc.)
    const getMonthName = (dateStr) => {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const monthNum = parseInt(dateStr.split('-')[1]);
        return months[monthNum - 1] || '---';
    };

    const monthAbbr = getMonthName(date);
    const seqNo = String(sequence || customer.last_inv_no || 0).padStart(2, '0');
    const formattedBillNo = `${monthAbbr}/${seqNo}`;

    return (
        <div className="invoice-page">
            <div className="invoice-border-wrapper">
                {/* Header Section */}
                <div className="header-grid">
                    <div className="header-logo-box">
                        <img src="/logo.png" alt="3 Star" className="logo-img" />
                    </div>
                    <div className="header-info-box">
                        <h1 className="company-title">3 STAR PEST CONTROL</h1>
                        <div className="company-sub-details">
                            <p>39, Gandhi Road, Srirangam, Trichy - 620006</p>
                            <p>Mobile: 98424 74442 | 90430 21662 | 93451 31981</p>
                            <p>MSME / UDYAM Number: UDYAM-TN-270043001</p>
                            <p>Email: mani7221@gmail.com</p>
                        </div>
                    </div>
                </div>

                {/* Sub Header Bar */}
                <div className="sub-header-bar">
                    <div className="sub-left">To: BILLING DETAILS:</div>
                    <div className="sub-right">SERVICE MONTH:- <br></br>{serviceRange}</div>
                </div>

                {/* Billing Meta Section */}
                <div className="billing-meta-grid">
                    <div className="customer-details">
                        <h2 className="customer-name-heading">M/s. {customer.name}</h2>
                        <div className="customer-address-area">
                            {(customer.address || '').split(',').map((line, i) => (
                                <p key={i}>{line.trim()},</p>
                            ))}
                        </div>

                    </div>
                    <div className="invoice-meta">
                        <div className="meta-line">

                        </div>
                        <div className="meta-line"><span>Date</span> <span>: {date}</span></div>
                        <div className="meta-line bill-no-line">
                            <span>Bill No</span>
                            <span>: {formattedBillNo}</span>
                        </div>
                        <div className="meta-line"><span>Place</span> <span>: Trichy</span></div>
                    </div>
                </div>

                {/* Master Table */}
                <div className="table-wrapper">
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th width="10%">SL.NO.</th>
                                <th width="50%">PARTICULARS</th>
                                <th width="12%">QTY</th>
                                <th width="12%">RATE</th>
                                <th width="16%">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="txt-center" rowSpan="6">{sequence || 1}</td>
                                <td className="particulars-cell" rowSpan="6">
                                    <div className="particulars-wrapper">
                                        <div className="selected-services-list">
                                            {(customer.selected_services || []).map(service => (
                                                <span key={service} className="small-text">
                                                    • {service === 'Additional Services' && customer.additional_service_details
                                                        ? `${service} (${customer.additional_service_details})`
                                                        : service}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="gp-number-box">
                                            G.Pay No: 8012137942
                                        </div>
                                    </div>
                                </td>
                                <td className="txt-center txt-top">{customer.services_count || 1}</td>
                                <td className="txt-center txt-top">{customer.rate || 0}</td>
                                <td className="txt-center txt-right txt-top">{(amount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="grand-total-row">
                                <td colSpan="2" className="footer-empty-cell"></td>
                                <td colSpan="2" className="footer-label">GRAND TOTAL</td>
                                <td className="footer-value">₹{amount.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Amount in Words Area */}
                <div className="words-box">
                    <span className="w-label">AMOUNT in WORDS.:</span>
                    <span className="w-value">RUPEES {numberToWords(amount).toUpperCase()}</span>
                </div>

                {/* Footer Area */}
                <div className="invoice-bottom-area">
                    <div className="bank-side">
                        <p className="bank-head">OUR BANK DETAILS:</p>
                        <p>Bank: CITY UNION BANK</p>
                        <p>A/c No: 510909010052726</p>
                        <p>IFSC Code: CIUB0000023</p>
                        <p>Branch: Srirangam</p>
                    </div>

                    <div className="sig-side">
                        <p className="sig-for">For 3 STAR PEST CONTROL</p>
                        <div className="sig-label">Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
