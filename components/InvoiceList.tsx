
import React from 'react';
import { Invoice } from '../types';
import { InvoiceItem } from './InvoiceItem';

interface InvoiceListProps {
    invoices: Invoice[];
    onEdit: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onDownload: (invoice: Invoice) => void;
    onSendEmail: (email: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onEdit, onDelete, onDownload, onSendEmail }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Saved Invoices</h2>
            {invoices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No invoices found. Create one to get started!</p>
            ) : (
                <div className="space-y-3">
                    {invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(invoice => (
                        <InvoiceItem 
                            key={invoice.id} 
                            invoice={invoice}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            onSendEmail={onSendEmail}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
