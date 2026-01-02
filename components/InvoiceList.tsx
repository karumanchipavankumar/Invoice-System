
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../types';
import { InvoiceItem } from './InvoiceItem';
import { ICONS } from '../constants';

// changemail
import { sendInvoiceByEmail } from "../services/apiService";

interface InvoiceListProps {
    invoices: Invoice[];
    onEdit?: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onDownload: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onEdit, onDelete, onDownload }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
//changemail
const handleSendEmail = async (id: string) => {
  try {
    // Find the invoice to get full details for PDF generation
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) {
      alert(t('form.invoiceNotFound'));
      return;
    }
    
    // Check if invoice has email
    if (!invoice.employeeEmail || !invoice.employeeEmail.trim()) {
      alert('This invoice does not have an email address. Please add an email address to send the invoice.');
      return;
    }
    
    // Show loading state
    const confirmSend = window.confirm(`Send invoice to ${invoice.employeeEmail}?`);
    if (!confirmSend) {
      return;
    }
    
    await sendInvoiceByEmail(id, invoice);
    alert(`Invoice sent successfully to ${invoice.employeeEmail}!`);
  } catch (error: any) {
    const errorMessage = error?.message || t('form.emailError');
    console.error('Error sending email:', error);
    alert(`Failed to send email: ${errorMessage}`);
  }
};
    const filteredInvoices = useMemo(() => {
        if (!searchQuery.trim()) {
            return invoices;
        }

        const query = searchQuery.toLowerCase().trim();
        return invoices.filter(invoice => 
            invoice.invoiceNumber.toLowerCase().includes(query) ||
            invoice.employeeName.toLowerCase().includes(query) ||
            invoice.employeeEmail.toLowerCase().includes(query)
        );
    }, [invoices, searchQuery]);

    const sortedInvoices = filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <div className="space-y-4">
            {invoices.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-lg text-gray-600 font-medium mb-2">{t('app.status.noInvoices')}</p>
                    <p className="text-gray-500">{t('app.status.createFirst')}</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-lg text-gray-600 font-medium mb-2">{t('app.status.noResults')}</p>
                    <p className="text-gray-500">{t('app.status.adjustSearch')}</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        {t('app.actions.cancel')}
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sortedInvoices.map(invoice => (
                        <InvoiceItem 
                            key={invoice.id} 
                            invoice={invoice}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            //change mail
                            onSendEmail={handleSendEmail}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
