import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceList } from '../components/InvoiceList';
import { Invoice } from '../types';
import {
    createInvoice,
    updateInvoice,
    getAllInvoices,
    deleteInvoice
} from '../services/apiService';
import { generateInvoicePDF } from '../services/pdfService';
import { Modal } from '../components/Modal';
import { useCountry } from '../contexts/CountryContext';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { country, setCountry } = useCountry();
    const { companyInfo } = useAuth();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

    // Load invoices
    React.useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setIsLoading(true);
            const allInvoices = await getAllInvoices();
            setInvoices(allInvoices);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load invoices');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveInvoice = useCallback(async (invoice: Invoice) => {
        try {
            // Ensure invoice has country set
            const invoiceWithCountry = { ...invoice, country };
            if (selectedInvoice) {
                await updateInvoice(selectedInvoice.id, invoiceWithCountry);
            } else {
                await createInvoice(invoiceWithCountry);
            }
            setSelectedInvoice(null);
            setError(null);
            await loadInvoices();
            alert('Invoice saved successfully!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save invoice';
            setError(errorMessage);
            alert(errorMessage);
        }
    }, [selectedInvoice, country]);

    const handleDeleteClick = useCallback((id: string) => {
        setInvoiceToDelete(id);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (invoiceToDelete) {
            try {
                await deleteInvoice(invoiceToDelete);
                await loadInvoices();
                setError(null);
                alert('Invoice deleted successfully!');
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
                setError(errorMessage);
                alert(errorMessage);
            }
        }
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
    }, [invoiceToDelete]);

    const handleClearSelection = useCallback(() => {
        setSelectedInvoice(null);
    }, []);

    const handleDownloadClick = useCallback((invoice: Invoice) => {
        // Show language selection modal or directly download
        // For simplicity, downloading in English
        generateInvoicePDF(invoice, 'en', companyInfo).catch((error) => {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        });
    }, [companyInfo]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Country Toggle Switch */}
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">Tax Country</h3>
                            <p className="text-xs text-gray-500">
                                {country === 'india' 
                                    ? 'India: CGST & SGST will be applied' 
                                    : 'Japan: Consumption Tax will be applied'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${country === 'india' ? 'text-blue-600' : 'text-gray-400'}`}>
                                India
                            </span>
                            <button
                                type="button"
                                onClick={() => setCountry(country === 'india' ? 'japan' : 'india')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    country === 'japan' ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                                role="switch"
                                aria-checked={country === 'japan'}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        country === 'japan' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className={`text-sm font-medium ${country === 'japan' ? 'text-blue-600' : 'text-gray-400'}`}>
                                Japan
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-red-700 font-medium">{error}</p>
                            <button 
                                onClick={() => setError(null)}
                                className="text-red-600 text-sm hover:underline ml-4"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Invoice Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Invoice</h2>
                        <p className="text-gray-600">Fill in the form below to create a new invoice</p>
                    </div>
                    <InvoiceForm 
                        onSave={handleSaveInvoice} 
                        selectedInvoice={selectedInvoice} 
                        clearSelection={handleClearSelection}
                        invoicesCount={invoices.length}
                    />
                </div>

                {/* Invoices List Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">All Invoices</h2>
                        <p className="text-gray-600">View and manage all your invoices</p>
                    </div>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading invoices...</p>
                        </div>
                    ) : (
                        <InvoiceList 
                            invoices={invoices} 
                            onEdit={setSelectedInvoice} 
                            onDelete={handleDeleteClick}
                            onDownload={handleDownloadClick}
                        />
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title={t('form.deleteConfirm')}
                    description={t('form.deleteConfirmDesc')}
                />
            </main>
        </div>
    );
};

