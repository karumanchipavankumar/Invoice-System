import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, ServiceItem } from '../types';
import { ICONS } from '../constants';

interface InvoiceFormProps {
    onSave: (invoice: Invoice) => void;
    selectedInvoice: Invoice | null;
    clearSelection: () => void;
    invoicesCount: number;
}

const createEmptyInvoice = (count: number): Omit<Invoice, 'id'> => ({
    invoiceNumber: `INV#OF-${String(new Date().getTime()).slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    employeeName: '',
    employeeId: '',
    employeeEmail: '',
    employeeAddress: '',
    employeeMobile: '',
    services: [{ id: `service-${Date.now()}`, description: '', hours: 1, rate: 0 }],
    taxRate: 10,
});


export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, selectedInvoice, clearSelection, invoicesCount }) => {
    const [invoiceData, setInvoiceData] = useState(createEmptyInvoice(invoicesCount));

    useEffect(() => {
        if (selectedInvoice) {
            setInvoiceData(selectedInvoice);
        } else {
            setInvoiceData(createEmptyInvoice(invoicesCount));
        }
    }, [selectedInvoice, invoicesCount]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (id: string, field: keyof Omit<ServiceItem, 'id'>, value: string | number) => {
        setInvoiceData(prev => ({
            ...prev,
            services: prev.services.map(service => 
                service.id === id ? { ...service, [field]: value } : service
            )
        }));
    };
    
    const addService = () => {
        setInvoiceData(prev => ({
            ...prev,
            services: [...prev.services, { id: `service-${Date.now()}`, description: '', hours: 1, rate: 0 }]
        }));
    };

    const removeService = (id: string) => {
        setInvoiceData(prev => ({
            ...prev,
            services: prev.services.filter(service => service.id !== id)
        }));
    };

    const { subTotal, taxAmount, grandTotal } = useMemo(() => {
        const subTotal = invoiceData.services.reduce((acc, service) => acc + service.hours * service.rate, 0);
        const taxAmount = subTotal * (invoiceData.taxRate / 100);
        const grandTotal = subTotal + taxAmount;
        return { subTotal, taxAmount, grandTotal };
    }, [invoiceData.services, invoiceData.taxRate]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...invoiceData, id: selectedInvoice?.id || `invoice-${Date.now()}` });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 sticky top-6 border border-gray-600">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
                {selectedInvoice && (
                    <button type="button" onClick={clearSelection} className="text-sm text-blue-600 hover:underline">New Invoice</button>
                )}
            </div>
            
            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Invoice #</label>
                    <input type="text" value={invoiceData.invoiceNumber} readOnly className="mt-1 block w-full border-gray-600 rounded-md shadow-sm bg-gray-100 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" name="date" value={invoiceData.date} onChange={handleInputChange} className="mt-1 block w-full border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
                </div>
            </div>

            {/* Employee Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-600 pb-2">Employee Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" name="employeeName" placeholder="Employee Name" value={invoiceData.employeeName} onChange={handleInputChange} className="mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" required />
                    <input type="text" name="employeeId" placeholder="Employee ID" value={invoiceData.employeeId} onChange={handleInputChange} className="mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" disabled={!!selectedInvoice} required />
                    <input type="email" name="employeeEmail" placeholder="Employee Email" value={invoiceData.employeeEmail} onChange={handleInputChange} className="mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" required />
                    <input type="text" name="employeeMobile" placeholder="Employee Mobile" value={invoiceData.employeeMobile} onChange={handleInputChange} className="mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" required />
                </div>
                <textarea name="employeeAddress" placeholder="Employee Address" value={invoiceData.employeeAddress} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" required></textarea>
            </div>

            {/* Services */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-600 pb-2">Services</h3>
                <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-gray-600 px-1 mt-2">
                    <div className="col-span-5">Service Description</div>
                    <div className="col-span-2">Hours Worked</div>
                    <div className="col-span-2">Unit Rate</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1"></div> {/* For delete button column */}
                </div>
                {invoiceData.services.map((service, index) => (
                    <div key={service.id} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" placeholder="Service Description" value={service.description} onChange={(e) => handleServiceChange(service.id, 'description', e.target.value)} className="col-span-5 mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" required />
                        <input type="number" placeholder="Hours Worked" value={service.hours} onChange={(e) => handleServiceChange(service.id, 'hours', parseFloat(e.target.value) || 0)} className="col-span-2 mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" min="0" />
                        <input type="number" placeholder="Unit Rate" value={service.rate} onChange={(e) => handleServiceChange(service.id, 'rate', parseFloat(e.target.value) || 0)} className="col-span-2 mt-1 block w-full border-gray-600 rounded-md shadow-sm sm:text-sm" min="0" />
                        <span className="col-span-2 text-right text-sm">₹{(service.hours * service.rate).toFixed(2)}</span>
                        <button type="button" onClick={() => removeService(service.id)} className="col-span-1 text-red-500 hover:text-red-700 flex justify-center items-center">
                           {ICONS.DELETE}
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addService} className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                    {ICONS.PLUS} Add Service
                </button>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-600 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Subtotal</span>
                    <span className="text-sm font-medium">₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <label className="text-sm font-medium text-gray-700">Tax (%)</label>
                         <input type="number" name="taxRate" value={invoiceData.taxRate} onChange={(e) => setInvoiceData(prev => ({...prev, taxRate: parseFloat(e.target.value) || 0}))} className="w-20 border-gray-600 rounded-md shadow-sm sm:text-sm" />
                    </div>
                    <span className="text-sm font-medium">₹{taxAmount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-center border-t border-gray-600 pt-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                    <span className="text-lg font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                {selectedInvoice ? 'Update Invoice' : 'Save Invoice'}
            </button>
        </form>
    );
};