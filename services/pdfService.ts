import { Invoice } from '../types';

// These are loaded from CDN in index.html, so we declare them for TypeScript
declare const jspdf: any;

export const generateInvoicePDF = (invoice: Invoice) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Calculate totals
    const subTotal = invoice.services.reduce((acc, s) => acc + s.hours * s.rate, 0);
    const taxAmount = subTotal * (invoice.taxRate / 100);
    const grandTotal = subTotal + taxAmount;

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 14, 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Invoice Info
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 32);
    // FIX: Corrected typo from toLocaleDateDateString to toLocaleDateString
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 14, 38);

    // Employee Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.employeeName, 14, 58);
    doc.text(`Employee ID: ${invoice.employeeId}`, 14, 64);
    doc.text(invoice.employeeAddress, 14, 70);
    doc.text(invoice.employeeEmail, 14, 76);
    doc.text(invoice.employeeMobile, 14, 82);

    // Services Table
    const tableColumn = ["Description", "Hours", "Rate", "Total"];
    const tableRows: (string | number)[][] = [];

    invoice.services.forEach(service => {
        const serviceData = [
            service.description,
            service.hours.toFixed(2),
            `₹${service.rate.toFixed(2)}`,
            `₹${(service.hours * service.rate).toFixed(2)}`
        ];
        tableRows.push(serviceData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY;
    const rightAlignX = 196;
    doc.setFontSize(12);
    doc.text(`Subtotal:`, 150, finalY + 10, { align: 'right' });
    doc.text(`₹${subTotal.toFixed(2)}`, rightAlignX, finalY + 10, { align: 'right' });
    
    doc.text(`Tax (${invoice.taxRate}%):`, 150, finalY + 16, { align: 'right' });
    doc.text(`₹${taxAmount.toFixed(2)}`, rightAlignX, finalY + 16, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, 150, finalY + 24, { align: 'right' });
    doc.text(`₹${grandTotal.toFixed(2)}`, rightAlignX, finalY + 24, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 14, doc.internal.pageSize.height - 10);

    // Save PDF
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
};