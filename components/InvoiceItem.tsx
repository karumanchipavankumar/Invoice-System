import React, { useMemo } from 'react';
import { Invoice } from '../types';
import { ICONS } from '../constants';

interface InvoiceItemProps {
    invoice: Invoice;
    onEdit: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onDownload: (invoice: Invoice) => void;
    onSendEmail: (email: string) => void;
}

export const InvoiceItem: React.FC<InvoiceItemProps> = ({ invoice, onEdit, onDelete, onDownload, onSendEmail }) => {
    const grandTotal = useMemo(() => {
        const subTotal = invoice.services.reduce((acc, service) => acc + service.hours * service.rate, 0);
        const taxAmount = subTotal * (invoice.taxRate / 100);
        return subTotal + taxAmount;
    }, [invoice.services, invoice.taxRate]);
    
    return (
        <div className="p-4 border border-gray-600 rounded-lg hover:shadow-lg hover:border-blue-500 transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex-grow">
                    <p className="font-bold text-blue-600">{invoice.invoiceNumber}</p>
                    <p className="text-lg font-semibold text-gray-800">{invoice.employeeName} ({invoice.employeeId})</p>
                    <p className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <p className="text-xl font-bold text-right text-gray-900">₹{grandTotal.toFixed(2)}</p>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-600 flex items-center justify-end space-x-2">
                <ActionButton onClick={() => onEdit(invoice)} title="Edit">{ICONS.EDIT}</ActionButton>
                <ActionButton onClick={() => onDownload(invoice)} title="Download PDF">{ICONS.DOWNLOAD}</ActionButton>
                <ActionButton onClick={() => onSendEmail(invoice.employeeEmail)} title="Send Email">{ICONS.EMAIL}</ActionButton>
                <ActionButton onClick={() => onDelete(invoice.id)} title="Delete" variant="danger">{ICONS.DELETE}</ActionButton>
            </div>
        </div>
    );
};

interface ActionButtonProps {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    variant?: 'default' | 'danger';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, title, children, variant = 'default' }) => {
    const baseClasses = "p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantClasses = variant === 'danger'
        ? "text-gray-500 hover:bg-red-100 hover:text-red-600 focus:ring-red-500"
        : "text-gray-500 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-500";

    return (
        <button
            onClick={onClick}
            title={title}
            className={`${baseClasses} ${variantClasses}`}
        >
            {children}
        </button>
    );
}