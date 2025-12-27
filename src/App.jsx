import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Search, Calendar, Printer, Download, CheckCircle, Circle, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useReactToPrint } from 'react-to-print';
import Invoice from './components/Invoice';
import { seedDatabase } from './seed';
import './App.css';

function App() {
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [serviceMonthRange, setServiceMonthRange] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // null means adding a new one
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    services_count: 1,
    rate: 0,
    last_inv_no: 1,
    selected_services: ['Cockroach Service', 'Rat Service', 'Flies Service', 'General Pest Control Service'],
    additional_service_details: ''
  });

  const printRef = useRef();

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        address: customer.address || '',
        contact: customer.contact || '',
        services_count: customer.services_count || 1,
        rate: customer.rate || 0,
        last_inv_no: customer.last_inv_no || 0,
        selected_services: customer.selected_services || ['Cockroach Service', 'Rat Service', 'Flies Service', 'General Pest Control Service'],
        additional_service_details: customer.additional_service_details || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        address: '',
        contact: '',
        services_count: 1,
        rate: 0,
        last_inv_no: 1,
        selected_services: ['Cockroach Service', 'Rat Service', 'Flies Service', 'General Pest Control Service'],
        additional_service_details: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'Customers', editingCustomer.id), formData);
      } else {
        await addDoc(collection(db, 'Customers'), {
          ...formData,
          createdAt: new Date()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Error saving customer. Check console.");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `3-STAR-Invoices-${new Date().toISOString().split('T')[0]}`,
  });

  const handleSinglePrint = (id) => {
    setSelectedCustomers([id]);
    // Use a small timeout to ensure the print container has updated with only one invoice
    setTimeout(() => {
      handlePrint();
    }, 100);
  };


  useEffect(() => {
    // Listen to customers - using the 'Customers' collection as per migration script
    const qCustomers = query(collection(db, 'Customers'), orderBy('name'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
      setLoading(false);
    });

    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    });

    return () => {
      unsubCustomers();
      unsubSettings();
    };
  }, []);


  // Update Service Range automatically when Invoice Date changes
  useEffect(() => {
    if (invoiceDate) {
      const firstDay = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1);
      const lastDay = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0);

      const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
      };

      setServiceMonthRange(`${formatDate(firstDay)} TO ${formatDate(lastDay)}`);
    }
  }, [invoiceDate]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const updateCustomerField = async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'Customers', id), { [field]: value });
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const deleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteDoc(doc(db, 'Customers', id));
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-center full-screen">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  const printDateStr = invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="main-header no-print">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">3★</div>
            <h1> <span>PEST CONTROL</span></h1>
          </div>

          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <div className="global-inputs">
            <div className="input-group">
              <label>Invoice Date</label>
              <DatePicker
                selected={invoiceDate}
                onChange={(date) => setInvoiceDate(date)}
                dateFormat="dd-MM-yyyy"
                className="date-picker-input"
              />
            </div>
            <div className="input-group">
              <label>Service Range</label>
              <input
                type="text"
                value={serviceMonthRange}
                onChange={(e) => setServiceMonthRange(e.target.value)}
                placeholder="e.g. 01-10-2025 TO 31-10-2025"
                className="range-input"
              />
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              Add Customer
            </button>
            <button
              className="btn-primary"
              disabled={selectedCustomers.length === 0}
              onClick={() => handlePrint()}
            >
              <Printer size={18} />
              Generate All ({selectedCustomers.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="content no-print">
        <div className="stats-bar">
          {customers.length === 0 && (
            <div className="stat-card seed-card">
              <span className="stat-label">Initial Setup</span>
              <button className="btn-secondary" onClick={seedDatabase}>Seed 3-STAR Data</button>
            </div>
          )}
          <div className="stat-card">
            <span className="stat-label">Active Customers</span>
            <span className="stat-value">{customers.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Ready to Print</span>
            <span className="stat-value">{selectedCustomers.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Company</span>
            <span className="stat-value company-name-small">{settings.companyName || '3-STAR'}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="customer-table">
            <thead>
              <tr>
                <th className="select-col">
                  <button onClick={toggleSelectAll} className="checkbox-btn">
                    {selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ?
                      <CheckCircle className="checked" size={20} /> : <Circle size={20} />}
                  </button>
                </th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>Phone/Contact</th>
                <th>Quantity/Services</th>
                <th>Rate/Amount (₹)</th>
                <th>Total Bill</th>
                <th className="action-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => {
                const qty = customer.services_count || 0;
                const rate = customer.rate || 0;
                const total = qty * rate;

                return (
                  <tr key={customer.id} className={selectedCustomers.includes(customer.id) ? 'selected-row' : ''}>
                    <td className="select-col">
                      <button onClick={() => toggleSelect(customer.id)} className="checkbox-btn">
                        {selectedCustomers.includes(customer.id) ?
                          <CheckCircle className="checked" size={20} /> : <Circle size={20} />}
                      </button>
                    </td>
                    <td>
                      <div className="customer-info-cell">
                        <span className="customer-name-text">{customer.name}</span>
                      </div>
                    </td>
                    <td><span className="customer-address-text">{customer.address}</span></td>
                    <td><span className="customer-contact-text">{customer.contact || 'N/A'}</span></td>
                    <td><span className="qty-text">{qty}</span></td>
                    <td><span className="rate-text">₹{rate.toLocaleString()}</span></td>
                    <td><span className="total-badge">₹{total.toLocaleString()}</span></td>
                    <td className="action-col">
                      <div className="row-actions">
                        <button className="icon-btn" title="Download PDF" onClick={() => handleSinglePrint(customer.id)}>
                          <Download size={16} />
                        </button>
                        <button className="icon-btn edit-btn" title="Edit Customer" onClick={() => handleOpenModal(customer)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete-btn" title="Delete Customer" onClick={() => deleteCustomer(customer.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Adding/Editing Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="customer-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Customer Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., KMS Hakkim Biriyani"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter full address..."
                  />
                </div>
                <div className="form-group">
                  <label>Phone/Contact</label>
                  <input
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Mobile or Contact Name"
                  />
                </div>
                <div className="form-group">
                  <label>Bill Number Start</label>
                  <input
                    type="number"
                    value={formData.last_inv_no}
                    onChange={(e) => setFormData({ ...formData, last_inv_no: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Service Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>No. of Services</label>
                  <input
                    type="number"
                    required
                    value={formData.services_count}
                    onChange={(e) => setFormData({ ...formData, services_count: Number(e.target.value) })}
                  />
                </div>

                {/* Service Selection Checklist */}
                <div className="form-group full-width">
                  <label className="section-label">Selected Services (Invoice Particulars)</label>
                  <div className="services-checklist">
                    {['Cockroach Service', 'Rat Service', 'Flies Service', 'General Pest Control Service', 'Additional Services'].map(service => (
                      <label key={service} className="check-item">
                        <input
                          type="checkbox"
                          checked={formData.selected_services.includes(service)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...formData.selected_services, service]
                              : formData.selected_services.filter(s => s !== service);
                            setFormData({ ...formData, selected_services: updated });
                          }}
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.selected_services.includes('Additional Services') && (
                  <div className="form-group full-width">
                    <label>Additional Services Details</label>
                    <input
                      type="text"
                      value={formData.additional_service_details}
                      onChange={(e) => setFormData({ ...formData, additional_service_details: e.target.value })}
                      placeholder="e.g., Termite Treatment or Bed Bug Control"
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {filteredCustomers
            .filter(c => selectedCustomers.includes(c.id))
            .map((customer, index) => (
              <Invoice
                key={customer.id}
                customer={customer}
                sequence={index + 1}
                date={printDateStr}
                serviceRange={serviceMonthRange}
                settings={settings}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export default App;
