import React, { useMemo } from 'react';
import { Invoice } from '../types';
import { ICONS } from '../constants';

//changemail


interface InvoiceItemProps {
    invoice: Invoice;
    onEdit?: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onDownload: (invoice: Invoice) => void;
    //change mail
    onSendEmail: (id: string) => void;
}

export const InvoiceItem: React.FC<InvoiceItemProps> = ({ invoice, onEdit, onDelete, onDownload,onSendEmail }) => {
    const grandTotal = useMemo(() => {
        const subTotal = invoice.services?.reduce((acc, service) => 
            acc + (service.hours * service.rate), 0) || 0;
        const taxAmount = subTotal * ((invoice.taxRate || 0) / 100);
        return subTotal + taxAmount;
    }, [invoice.services, invoice.taxRate]);
    
    return (
        <div className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-5 border-b border-gray-100 transition-colors">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <div className="sm:col-span-2">
                        <p className="text-sm font-semibold text-blue-600 mb-1">{invoice.invoiceNumber}</p>
                        <p className="text-lg font-bold text-gray-900">{invoice.employeeName}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {invoice.employeeId}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                        <p className="text-sm font-semibold text-gray-700">{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="text-2xl font-bold text-blue-600">₹{grandTotal.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            
            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-600">{invoice.employeeEmail}</p>
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <ActionButton onClick={() => onEdit(invoice)} title="Edit" variant="info">{ICONS.EDIT}</ActionButton>
                    )}
                    <ActionButton onClick={() => onDownload(invoice)} title="Download PDF" variant="info">{ICONS.DOWNLOAD}</ActionButton>
                    {/* changemail */}
                    {/* ✅ EMAIL BUTTON */}
                    <ActionButton onClick={() => onSendEmail(invoice.id)} title="Send Invoice Email" variant="info"> {ICONS.EMAIL} </ActionButton>
                    <ActionButton onClick={() => onDelete(invoice.id)} title="Delete" variant="danger">{ICONS.DELETE}</ActionButton>
                </div>
            </div>
        </div>
    );
};

interface ActionButtonProps {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'info';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, title, children, variant = 'default' }) => {
    const baseClasses = "p-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-110 active:scale-95";
    const variantClasses = {
        danger: "text-red-600 hover:bg-red-100 focus:ring-red-500",
        info: "text-gray-600 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-500",
        default: "text-gray-600 hover:bg-gray-200 focus:ring-gray-500",
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`${baseClasses} ${variantClasses[variant]}`}
        >
            {children}
        </button>
    );
}