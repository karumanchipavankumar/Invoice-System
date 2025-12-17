
import React, { useState, useCallback } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Invoice } from './types';
import { generateInvoicePDF } from './services/pdfService';
import { Modal } from './components/Modal';

const App: React.FC = () => {
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const [emailToSend, setEmailToSend] = useState<string>('');

    const handleSaveInvoice = useCallback((invoice: Invoice) => {
        if (selectedInvoice) {
            setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv));
        } else {
            const employeeIdExists = invoices.some(inv => inv.employeeId === invoice.employeeId);
            if(employeeIdExists) {
                alert('An employee with this ID already has an invoice. Please use a unique Employee ID.');
                return;
            }
            setInvoices(prev => [...prev, invoice]);
        }
        setSelectedInvoice(null);
    }, [invoices, selectedInvoice, setInvoices]);

    const handleSelectInvoice = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedInvoice(null);
    }, []);

    const handleDeleteClick = useCallback((id: string) => {
        setInvoiceToDelete(id);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (invoiceToDelete) {
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete));
            if (selectedInvoice?.id === invoiceToDelete) {
                setSelectedInvoice(null);
            }
        }
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
    }, [invoiceToDelete, selectedInvoice, setInvoices]);

    const handleDownload = useCallback((invoice: Invoice) => {
        generateInvoicePDF(invoice);
    }, []);

    const handleSendEmail = useCallback((email: string) => {
        setEmailToSend(email);
        setIsEmailModalOpen(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">Invoice Management System</h1>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <InvoiceForm 
                            onSave={handleSaveInvoice} 
                            selectedInvoice={selectedInvoice} 
                            clearSelection={handleClearSelection}
                            invoicesCount={invoices.length}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <InvoiceList 
                            invoices={invoices} 
                            onEdit={handleSelectInvoice} 
                            onDelete={handleDeleteClick}
                            onDownload={handleDownload}
                            onSendEmail={handleSendEmail}
                        />
                    </div>
                </div>
            </main>
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                description="Are you sure you want to delete this invoice? This action cannot be undone."
            />
            <Modal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onConfirm={() => setIsEmailModalOpen(false)}
                title="Email Sent"
                description={`An email has been sent to ${emailToSend}. (This is a simulation).`}
                confirmText="OK"
                showCancel={false}
            />
        </div>
    );
};

export default App;
