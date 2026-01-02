import { Invoice, CompanyInfo } from '../types';
import { calculateTax, Country } from '../services/countryPreferenceService';
import jsPDF from 'jspdf';
import i18n from '../src/i18n/i18n';
import { configureJapaneseFont, renderJapaneseText } from './japaneseFontSupport';
import html2canvas from 'html2canvas';
import { getCompanyInfo } from './authService';

// Helper function to add text to PDF (handles Japanese properly using html2canvas)
const addTextToPdf = async (
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    options: {
        fontSize?: number;
        fontStyle?: 'normal' | 'bold';
        align?: 'left' | 'center' | 'right';
        language?: 'en' | 'ja';
        maxWidth?: number;
    } = {}
): Promise<void> => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', language = 'en', maxWidth = 100 } = options;
    
    // Check if text contains Japanese characters
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    
    if (hasJapanese || language === 'ja') {
        // Use html2canvas for Japanese text
        try {
            const imageData = await renderJapaneseText(text, fontSize, fontStyle, maxWidth, align);
            if (imageData && imageData !== 'data:,') {
                // Get image dimensions
                const img = new Image();
                await new Promise<void>((resolve) => {
                    img.onload = () => {
                        const aspectRatio = img.width / img.height;
                        const height = maxWidth / aspectRatio;
                        // Adjust positions based on alignment
                        let adjustedX = x;
                        let adjustedY = y;
                        
                        if (align === 'right') {
                            // For right alignment, x is the right edge, so we need to subtract the image width
                            adjustedX = x - maxWidth;
                            adjustedY = y - height;
                        } else if (align === 'center') {
                            adjustedX = x - maxWidth / 2;
                            adjustedY = y - height / 2;
                        } else {
                            // Left alignment
                            adjustedY = y - height;
                        }
                        
                        // Add image with basic settings
                        doc.addImage(imageData, 'PNG', adjustedX, adjustedY, maxWidth, height, '', 'FAST');
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn('Image load failed, using fallback');
                        resolve();
                    };
                    img.src = imageData;
                });
            } else {
                // Fallback to regular text if rendering fails
                doc.setFont('helvetica', fontStyle);
                doc.setFontSize(fontSize);
                doc.text(text, x, y, { align, maxWidth });
            }
        } catch (error) {
            console.warn('Error rendering Japanese text, using fallback:', error);
            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            doc.text(text, x, y, { align, maxWidth });
        }
    } else {
        // Use regular jsPDF text for English
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.text(text, x, y, { align, maxWidth });
    }
};

// Helper function to get translations from i18n
const getTranslations = async (language: 'en' | 'ja') => {
    // Temporarily change language to get translations - MUST await this!
    const currentLang = i18n.language;
    console.log('Changing language from', currentLang, 'to', language);
    await i18n.changeLanguage(language);
    
    // Wait a bit to ensure translations are loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Current i18n language after change:', i18n.language);
    console.log('Sample translation test:', i18n.t('invoice.from'));
    
    const t = {
        invoice: language === 'ja' ? '請求書' : 'INVOICE',
        companyName: i18n.t('invoice.companyName'),
        from: i18n.t('invoice.from'),
        billTo: i18n.t('invoice.to'),
        description: i18n.t('invoice.description'),
        hours: i18n.t('invoice.hours'),
        unitPrice: i18n.t('invoice.unitPrice'),
        amount: i18n.t('invoice.amount'),
        subtotal: i18n.t('invoice.subtotal'),
        cgst: i18n.t('invoice.cgst'),
        sgst: i18n.t('invoice.sgst'),
        consumptionTax: i18n.t('invoice.consumptionTax'),
        total: i18n.t('invoice.total'),
        grandTotal: i18n.t('invoice.grandTotal'),
        thankYou: i18n.t('invoice.thankYou'),
        invoiceNo: i18n.t('invoice.invoiceNo'),
        date: i18n.t('invoice.dateLabel'),
        dueDate: i18n.t('invoice.dueLabel'),
        employeeId: i18n.t('invoice.employeeId'),
        email: i18n.t('invoice.email'),
        phone: i18n.t('invoice.phone'),
        address: i18n.t('invoice.address'),
        thankYouMessage: language === 'ja' ? '今後ともご愛顧のほどよろしくお願い申し上げます。' : i18n.t('invoice.thankYou'),
        companySeal: language === 'ja' ? '〒 (会社印)' : '',
        paymentInstructions: i18n.t('payment.instructions'),
        bankName: i18n.t('payment.bankName'),
        branchName: i18n.t('payment.branchName'),
        accountType: i18n.t('payment.accountType'),
        accountNumber: i18n.t('payment.accountNumber'),
        accountName: i18n.t('payment.accountName'),
        ifsc: i18n.t('payment.ifsc'),
        branchCode: i18n.t('payment.branchCode'),
        paymentNote: i18n.t('payment.note'),
        authorisedSignature: i18n.t('payment.authorisedSignature'),
        contactInfo: i18n.t('contact.info'),
        phoneHours: i18n.t('contact.phoneHours'),
        companyTagline: i18n.t('company.tagline'),
        // Company address components - use translations
        companyAddress: i18n.t('company.address'),
        companyGstin: i18n.t('company.gstin'),
        companyPhone: i18n.t('company.phone'),
        companyEmail: i18n.t('company.email')
    };
    
    // Restore original language
    await i18n.changeLanguage(currentLang);
    
    return t;
};

// Helper function to optimize image data for PDF
const optimizeImageForPdf = (canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Calculate new dimensions maintaining aspect ratio
    let width = canvas.width;
    let height = canvas.height;
    
    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
    }
    
    if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
    }
    
    // Create a new canvas with optimized dimensions
    const optimizedCanvas = document.createElement('canvas');
    optimizedCanvas.width = Math.floor(width);
    optimizedCanvas.height = Math.floor(height);
    const optimizedCtx = optimizedCanvas.getContext('2d');
    
    if (!optimizedCtx) return '';
    
    // Apply image smoothing for better quality when downscaling
    optimizedCtx.imageSmoothingEnabled = true;
    optimizedCtx.imageSmoothingQuality = 'high';
    
    // Draw the image to the optimized canvas
    optimizedCtx.drawImage(canvas, 0, 0, optimizedCanvas.width, optimizedCanvas.height);
    
    // Convert to JPEG with quality 0.8 (80%) for better compression
    return optimizedCanvas.toDataURL('image/jpeg', 0.8);
};

// Helper function to load logo image and add it to PDF with optimization
const addLogoToPdf = async (doc: jsPDF, x: number, y: number, logoUrl: string | null | undefined, width: number = 40): Promise<void> => {
    return new Promise<void>((resolve) => {
        try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                console.warn('Not in browser environment, skipping logo');
                resolve();
                return;
            }
            
            // If no logo URL provided, skip logo
            if (!logoUrl) {
                console.log('No logo URL provided, skipping logo');
                resolve();
                return;
            }
            
            const img = new Image();
            let resolved = false;
            
            const finish = () => {
                if (resolved) return;
                resolved = true;
                resolve();
            };
            
            // Construct full URL if it's a relative path
            const baseUrl = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'http://localhost:8080';
            const imageUrl = logoUrl.startsWith('http') 
                ? logoUrl 
                : `${baseUrl}${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`;
            
            console.log('Loading logo from URL:', imageUrl);
            
            img.onload = () => {
                try {
                    if (!img.complete) {
                        console.warn('Image not complete');
                        finish();
                        return;
                    }
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        console.warn('Could not get canvas context for logo');
                        finish();
                        return;
                    }
                    
                    // Use natural dimensions or fallback to reasonable defaults
                    const imgWidth = img.naturalWidth > 0 ? img.naturalWidth : 320;
                    const imgHeight = img.naturalHeight > 0 ? img.naturalHeight : 70;
                    
                    // Set canvas size to actual image size
                    canvas.width = imgWidth;
                    canvas.height = imgHeight;
                    
                    // Fill with white background
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw the image to canvas
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                    
                    // Optimize the image (max 800x600 for logos is more than enough)
                    const optimizedImageData = optimizeImageForPdf(canvas, 800, 600);
                    
                    if (!optimizedImageData) {
                        console.warn('Failed to optimize logo');
                        finish();
                        return;
                    }
                    
                    // Calculate height maintaining aspect ratio
                    const aspectRatio = imgWidth / imgHeight;
                    const height = width / aspectRatio;
                    
                    // Add optimized image to PDF
                    try {
                        // Use 'JPEG' format for better compression
                        doc.addImage(optimizedImageData, 'JPEG', x, y, width, height);
                        console.log(`Logo added to PDF at position (${x}, ${y}), size: ${width.toFixed(1)}x${height.toFixed(1)}`);
                        finish();
                    } catch (addError) {
                        console.error('Error adding logo to PDF:', addError);
                        finish();
                    }
                } catch (error) {
                    console.error('Error processing logo:', error);
                    finish();
                }
            };
            
            img.onerror = (error) => {
                console.error('Could not load logo image:', error);
                finish();
            };
            
            // Try with crossOrigin first
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            
            // Fallback timeout (reduced from 5s to 3s)
            setTimeout(() => {
                if (!resolved && (!img.complete || img.naturalWidth === 0)) {
                    console.warn('Logo load timeout');
                    finish();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error setting up logo for PDF:', error);
            resolve();
        }
    });
};

// Generate PDF and return as bytes for email attachment - uses SAME logic as generateInvoicePDF
export const generateInvoicePDFBytes = async (invoice: Invoice, language: 'en' | 'ja' = 'en', companyInfoParam?: CompanyInfo | null): Promise<Uint8Array> => {
    // Get translations from i18n - MUST await this!
    const t = await getTranslations(language);
    
    try {
        console.log('Generating PDF bytes for email (same as download):', invoice.invoiceNumber, 'Language:', language);
        
        const doc = new jsPDF();
        
        // Configure font support for Japanese if needed
        if (language === 'ja') {
            configureJapaneseFont(doc);
        }
        
        let yPosition = 18;

        const formatAmount = (value: number) => {
            const fixed = value.toFixed(2);
            const [integerPart, decimalPart] = fixed.split('.');
            const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${withCommas}.${decimalPart}`;
        };

        // Calculate totals - EXACT same logic as generateInvoicePDF
        const subTotal = invoice.services.reduce((acc, s) => acc + (s.hours * s.rate), 0);
        const countryForEmail: Country = invoice.country || 'india';
        const taxRate = invoice.taxRate || 0;
        const taxCalculation = calculateTax(subTotal, taxRate, countryForEmail);
        
        const { grandTotal, cgstRate, sgstRate, cgstAmount, sgstAmount, consumptionTaxRate, consumptionTaxAmount } = taxCalculation;

        // Format date as DD/MM/YYYY
        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // Get company info if not provided
        const companyInfoToUse = companyInfoParam || getCompanyInfo();
        
        // Add logo at top left (use dynamic logo from companyInfo)
        await addLogoToPdf(doc, 14, yPosition, companyInfoToUse?.companyLogoUrl, 50);

        // Invoice # and Date (top right)
        await addTextToPdf(doc, `${t.invoiceNo} ${invoice.invoiceNumber}`, 196, yPosition, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 50 
        });
        await addTextToPdf(doc, `${t.date} ${formatDate(invoice.date)}`, 196, yPosition + 7, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 50 
        });
        if (invoice.dueDate) {
            await addTextToPdf(doc, `${t.dueDate} ${formatDate(invoice.dueDate)}`, 196, yPosition + 14, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 50 
            });
        }

        // Set yPosition for content start (account for logo height ~11mm)
        yPosition += 15;

        // From Address (Company Details) - Left side
        const fromStartY = yPosition;
        await addTextToPdf(doc, t.from, 14, fromStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            language,
            maxWidth: 100 
        });
        let fromY = fromStartY + 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        // Use translated company information based on language
        const fromLines = language === 'ja' 
            ? [
                t.companyName,
                ...t.companyAddress.split('、'), // Split Japanese address by Japanese comma
                t.companyGstin,
                t.companyPhone,
                t.companyEmail,
            ]
            : [
                'Ory Folks Pvt Ltd',
                'Vedayapalem',
                'Nellore, Andhra Pradesh',
                'PIN: 524004',
                'India',
                'GSTIN: 29ABCDE1234F1Z5',
                'Phone: +91 98765 43210',
                'Email: info@oryfolks.com',
            ];
        for (const line of fromLines) {
            if (line && line.trim()) { // Only add non-empty lines
                await addTextToPdf(doc, line.trim(), 14, fromY, { 
                    fontSize: 10, 
                    language,
                    maxWidth: 100 
                });
                fromY += 6;
            }
        }

        // Bill To (Employee Info) - Right corner - Always show if employee name exists
        let billToY = fromStartY + 7;
        if (invoice.employeeName && invoice.employeeName.trim() && invoice.employeeName !== 'N/A') {
        await addTextToPdf(doc, t.billTo, 196, fromStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 80 
        });
            billToY = fromStartY + 7;
            
            // Employee Name - always show
            await addTextToPdf(doc, invoice.employeeName.trim(), 196, billToY, { 
                fontSize: 10, 
                align: 'right', 
                language,
                maxWidth: 80 
            });
        billToY += 6;
            
            // Employee ID
            if (invoice.employeeId && invoice.employeeId.trim()) {
                await addTextToPdf(doc, `${t.employeeId}: ${invoice.employeeId.trim()}`, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
        billToY += 6;
            }
            
            // Email
            if (invoice.employeeEmail && invoice.employeeEmail.trim()) {
                await addTextToPdf(doc, `${t.email}: ${invoice.employeeEmail.trim()}`, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
        billToY += 6;
            }
            
            // Phone
            if (invoice.employeeMobile && invoice.employeeMobile.trim()) {
                await addTextToPdf(doc, `${t.phone}: ${invoice.employeeMobile.trim()}`, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
        billToY += 6;
            }
            
            // Address - handle multi-line properly
            if (invoice.employeeAddress && invoice.employeeAddress.trim()) {
        const addressLabel = `${t.address}:`;
                // Split address by common delimiters and render each line
                const addressLines = invoice.employeeAddress.split(/[,\n]/).map(line => line.trim()).filter(line => line);
                if (addressLines.length > 0) {
                    await addTextToPdf(doc, addressLabel, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
                    billToY += 6;
                    // Render each address line
                    for (const line of addressLines) {
                        await addTextToPdf(doc, line, 196, billToY, { 
                            fontSize: 10, 
                            align: 'right', 
                            language,
                            maxWidth: 80 
                        });
                        billToY += 6;
                    }
                }
            }
        }

        // Set yPosition to the maximum of both sections plus spacing
        yPosition = Math.max(fromY, billToY) + 10;

        // Services Table Header with better formatting - EXACT same as generateInvoicePDF
        const tableStartY = yPosition;
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        
        // Draw top border
        doc.line(14, tableStartY - 5, 196, tableStartY - 5);
        
        // Header background (light gray)
        doc.setFillColor(245, 245, 245);
        doc.rect(14, tableStartY - 5, 182, 8, 'F');
        
        // Header text
        await addTextToPdf(doc, t.description, 14, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            language,
            maxWidth: 85 
        });
        await addTextToPdf(doc, t.hours, 100, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        await addTextToPdf(doc, t.unitPrice, 150, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        await addTextToPdf(doc, t.amount, 190, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 20 
        });

        yPosition = tableStartY + 3;
        doc.setDrawColor(200);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 6;

        // Services Table Body - EXACT same as generateInvoicePDF
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        invoice.services.forEach((service, index) => {
            const amount = service.hours * service.rate;
            const descLines = doc.splitTextToSize(service.description || '-', 70);
            const rowHeight = Math.max(8, descLines.length * 6);
            
            // Draw row border if not first row
            if (index > 0) {
                doc.setDrawColor(230);
                doc.line(14, yPosition - 2, 196, yPosition - 2);
            }
            
            // SNO (Serial Number)
            doc.text(String(index + 1), 14, yPosition);
            
            // Description
            doc.text(descLines, 30, yPosition);
            
            // Hours
            doc.text(service.hours.toFixed(2), 100, yPosition, { align: 'right' });
            
            // Unit Price
            doc.text(formatAmount(service.rate), 150, yPosition, { align: 'right' });
            
            // Amount
            doc.text(formatAmount(amount), 190, yPosition, { align: 'right' });
            
            yPosition += rowHeight;

            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });
        
        yPosition += 3;
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 8;
        
        // Totals section - EXACT same as generateInvoicePDF
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        await addTextToPdf(doc, t.subtotal + ':', 135, yPosition, { 
            fontSize: 10, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const currencyForSubtotal = countryForEmail === 'japan' ? 'JPY' : 'INR';
        doc.text(currencyForSubtotal + ' ' + formatAmount(subTotal), 196, yPosition, { align: 'right' });
        yPosition += 8;
        
        // Display tax based on country
        if (countryForEmail === 'japan' && consumptionTaxRate && consumptionTaxRate > 0) {
            // Japan: Consumption Tax
            doc.setFont('helvetica', 'bold');
            await addTextToPdf(doc, `${t.consumptionTax} (${consumptionTaxRate.toFixed(2)}%):`, 135, yPosition, { 
                fontSize: 10, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 50 
            });
            doc.setFont('helvetica', 'normal');
            doc.text('JPY ' + formatAmount(consumptionTaxAmount || 0), 196, yPosition, { align: 'right' });
            yPosition += 8;
        } else {
            // India: CGST & SGST
            if (cgstRate && cgstRate > 0) {
                doc.setFont('helvetica', 'bold');
            await addTextToPdf(doc, `${t.cgst} (${cgstRate.toFixed(2)}%):`, 135, yPosition, { 
                fontSize: 10, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 50 
            });
                doc.setFont('helvetica', 'normal');
                doc.text('INR ' + formatAmount(cgstAmount || 0), 196, yPosition, { align: 'right' });
            yPosition += 8;
        }
        
            if (sgstRate && sgstRate > 0) {
                doc.setFont('helvetica', 'bold');
            await addTextToPdf(doc, `${t.sgst} (${sgstRate.toFixed(2)}%):`, 135, yPosition, { 
                fontSize: 10, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 50 
            });
                doc.setFont('helvetica', 'normal');
                doc.text('INR ' + formatAmount(sgstAmount || 0), 196, yPosition, { align: 'right' });
            yPosition += 8;
        }
        }
        
        // Grand Total with emphasis
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.line(135, yPosition - 2, 196, yPosition - 2);
        yPosition += 3;
        
        await addTextToPdf(doc, t.grandTotal + ':', 135, yPosition, { 
            fontSize: 12, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const currencyForGrandTotal = countryForEmail === 'japan' ? 'JPY' : 'INR';
        doc.text(currencyForGrandTotal + ' ' + formatAmount(grandTotal), 196, yPosition, { align: 'right' });
        yPosition += 15;
        
        // Payment Details section (for English)
        if (language === 'en') {
            yPosition += 10;
            await addTextToPdf(doc, t.paymentInstructions, 14, yPosition, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                language,
                maxWidth: 100 
            });
            yPosition += 7;
            // Use dynamic bank details from companyInfo
            const companyInfoToUse3 = companyInfoParam || getCompanyInfo();
            const bankDetails = companyInfoToUse3?.bankDetails;
            const accountName = bankDetails?.accountHolderName || companyInfoToUse3?.companyName || 'Ory Folks Pvt Ltd';
            const accountNumber = bankDetails?.accountNumber || '123456789012';
            const ifscCode = bankDetails?.ifscCode || 'HDFC0001234';
            const branchCode = bankDetails?.branchCode || '01234';
            
            await addTextToPdf(doc, `${t.accountName} ${accountName}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountNumber} ${accountNumber}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.ifsc} ${ifscCode}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            if (branchCode) {
                await addTextToPdf(doc, `${t.branchCode} ${branchCode}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
                yPosition += 6;
            }
            yPosition += 6;
            await addTextToPdf(doc, t.paymentNote, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 15;
        }

        // Authorised Signature (bottom right)
        const sigY = Math.min(yPosition + 10, 270);
        doc.line(130, sigY, 196, sigY);
        await addTextToPdf(doc, t.authorisedSignature, 163, sigY + 6, { 
            fontSize: 9, 
            align: 'right', 
            language,
            maxWidth: 60 
        });
        yPosition = sigY + 15;

        // Add final thank you note and company seal for Japanese - EXACT same as generateInvoicePDF
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        if (language === 'ja') {
            yPosition += 15;
            await addTextToPdf(doc, t.thankYouMessage, 105, yPosition, { 
                fontSize: 9, 
                align: 'center', 
                language,
                maxWidth: 182 
            });
            
            // Add company seal area for Japanese documents
            yPosition += 10;
            await addTextToPdf(doc, t.companySeal, 160, yPosition, { 
                fontSize: 9, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 60 
            });
            
            // Add payment instructions in Japanese
            yPosition += 15;
            await addTextToPdf(doc, t.paymentInstructions, 14, yPosition, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.bankName} 三菱UFJ銀行`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.branchName} 東京支店`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountType} 普通預金`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountNumber} 1234567`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountName} 株式会社オライフォークス`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, t.paymentNote, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            
            // Add contact information
            yPosition += 12;
            await addTextToPdf(doc, t.contactInfo, 14, yPosition, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `TEL: 03-1234-5678 ${t.phoneHours}`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Email: info@oryfolks.co.jp', 20, yPosition);
        } else {
            await addTextToPdf(doc, t.thankYou, 105, yPosition, { 
                fontSize: 9, 
                align: 'center', 
                language,
                maxWidth: 182 
            });
        }

        // Return PDF as bytes
        const arrayBuffer = doc.output('arraybuffer');
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error('Error generating PDF bytes:', error);
        throw error;
    }
};

export const generateInvoicePDF = async (invoice: Invoice, language: 'en' | 'ja' = 'en', companyInfoParam?: CompanyInfo | null) => {
    // Get translations from i18n - MUST await this!
    const t = await getTranslations(language);
    
    try {
        console.log('Starting PDF generation for invoice:', invoice.invoiceNumber, 'Language:', language);
        
        // Initialize PDF with compression and optimization settings
        const doc = new jsPDF({
            compress: true,  // Enable compression
            precision: 1,    // Reduce coordinate precision (smaller file size)
            unit: 'mm',
            format: 'a4'
        });
        
        // Set document metadata for smaller size
        doc.setProperties({
            title: `Invoice ${invoice.invoiceNumber}`,
            creator: 'Invoice Generator',
            author: 'Invoice Generator'
        });
        
        // Configure font support for Japanese if needed
        if (language === 'ja') {
            configureJapaneseFont(doc);
        }
        
        let yPosition = 18;

        const formatAmount = (value: number) => {
            const fixed = value.toFixed(2); // plain "1234.50"
            const [integerPart, decimalPart] = fixed.split('.');
            const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${withCommas}.${decimalPart}`;
        };

        // Format date as DD/MM/YYYY
        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // Calculate totals based on country
        const subTotal = invoice.services.reduce((acc, s) => acc + (s.hours * s.rate), 0);
        const country: Country = invoice.country || 'india';
        const taxRate = invoice.taxRate || 0;
        const taxCalculation = calculateTax(subTotal, taxRate, country);
        
        const { grandTotal, cgstRate, sgstRate, cgstAmount, sgstAmount, consumptionTaxRate, consumptionTaxAmount } = taxCalculation;

        console.log('Calculated totals:', { subTotal, country, taxCalculation });

        // Get company info if not provided
        const companyInfoToUse = companyInfoParam || getCompanyInfo();

        // Add logo at top left (use dynamic logo from companyInfo)
        await addLogoToPdf(doc, 14, yPosition, companyInfoToUse?.companyLogoUrl, 50);

        // Invoice # and Date (top right)
        await addTextToPdf(doc, `${t.invoiceNo} ${invoice.invoiceNumber}`, 196, yPosition, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 50 
        });
        await addTextToPdf(doc, `${t.date} ${formatDate(invoice.date)}`, 196, yPosition + 7, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 50 
        });
        if (invoice.dueDate) {
            await addTextToPdf(doc, `${t.dueDate} ${formatDate(invoice.dueDate)}`, 196, yPosition + 14, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 50 
            });
        }

        // Set yPosition for content start (account for logo height ~11mm)
        yPosition += 15;

        // From Address (Company Details) - Left side
        const fromStartY = yPosition;
        await addTextToPdf(doc, t.from, 14, fromStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            language,
            maxWidth: 100 
        });
        let fromY = fromStartY + 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        // Use translated company information based on language
        const fromLines = language === 'ja' 
            ? [
                t.companyName,
                ...t.companyAddress.split('、'), // Split Japanese address by Japanese comma
                t.companyGstin,
                t.companyPhone,
                t.companyEmail,
            ]
            : [
                'Ory Folks Pvt Ltd',
                'Vedayapalem',
                'Nellore, Andhra Pradesh',
                'PIN: 524004',
                'India',
                'GSTIN: 29ABCDE1234F1Z5',
                'Phone: +91 98765 43210',
                'Email: info@oryfolks.com',
            ];
        for (const line of fromLines) {
            if (line && line.trim()) { // Only add non-empty lines
                await addTextToPdf(doc, line.trim(), 14, fromY, { 
                    fontSize: 10, 
                    language,
                    maxWidth: 100 
                });
                fromY += 6;
            }
        }

        // Bill To (Employee Info) - Right corner - Always show if employee name exists
        let billToY = fromStartY + 7;
        if (invoice.employeeName && invoice.employeeName.trim() && invoice.employeeName !== 'N/A') {
        await addTextToPdf(doc, t.billTo, 196, fromStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 80 
        });
            billToY = fromStartY + 7;
            
            // Employee Name - always show
            await addTextToPdf(doc, invoice.employeeName.trim(), 196, billToY, { 
                fontSize: 10, 
                align: 'right', 
                language,
                maxWidth: 80 
            });
        billToY += 6;
            
            // Employee ID
            if (invoice.employeeId && invoice.employeeId.trim()) {
                await addTextToPdf(doc, `${t.employeeId}: ${invoice.employeeId.trim()}`, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
        billToY += 6;
            }
            
            // Email
            if (invoice.employeeEmail && invoice.employeeEmail.trim()) {
                await addTextToPdf(doc, `${t.email}: ${invoice.employeeEmail.trim()}`, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
        billToY += 6;
            }
            
            // Phone
            if (invoice.employeeMobile && invoice.employeeMobile.trim()) {
                await addTextToPdf(doc, `${t.phone}: ${invoice.employeeMobile.trim()}`, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
        billToY += 6;
            }
            
            // Address - handle multi-line properly
            if (invoice.employeeAddress && invoice.employeeAddress.trim()) {
        const addressLabel = `${t.address}:`;
                // Split address by common delimiters and render each line
                const addressLines = invoice.employeeAddress.split(/[,\n]/).map(line => line.trim()).filter(line => line);
                if (addressLines.length > 0) {
                    await addTextToPdf(doc, addressLabel, 196, billToY, { 
            fontSize: 10, 
            align: 'right', 
            language,
            maxWidth: 80 
        });
                    billToY += 6;
                    // Render each address line
                    for (const line of addressLines) {
                        await addTextToPdf(doc, line, 196, billToY, { 
                            fontSize: 10, 
                            align: 'right', 
                            language,
                            maxWidth: 80 
                        });
                        billToY += 6;
                    }
                }
            }
        }

        // Set yPosition to the maximum of both sections plus spacing
        yPosition = Math.max(fromY, billToY) + 10;

        // Services Table Header with better formatting
        const tableStartY = yPosition;
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        
        // Draw top border
        doc.line(14, tableStartY - 5, 196, tableStartY - 5);
        
        // Header background (light gray)
        doc.setFillColor(245, 245, 245);
        doc.rect(14, tableStartY - 5, 182, 8, 'F');
        
        // Header text - Match reference image: SNO, Description, Hours, Unit Price, Amount
        await addTextToPdf(doc, 'SNO', 14, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            language,
            maxWidth: 15 
        });
        await addTextToPdf(doc, t.description, 30, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            language,
            maxWidth: 70 
        });
        await addTextToPdf(doc, t.hours, 100, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        await addTextToPdf(doc, t.unitPrice, 150, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        await addTextToPdf(doc, t.amount, 190, tableStartY, { 
            fontSize: 11, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 20 
        });

        yPosition = tableStartY + 3;
        doc.setDrawColor(200);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 6;

        // Services Table Body
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        invoice.services.forEach((service, index) => {
            const amount = service.hours * service.rate;
            const descLines = doc.splitTextToSize(service.description || '-', 70);
            const rowHeight = Math.max(8, descLines.length * 6);
            
            // Draw row border if not first row
            if (index > 0) {
                doc.setDrawColor(230);
                doc.line(14, yPosition - 2, 196, yPosition - 2);
            }
            
            // SNO (Serial Number)
            doc.text(String(index + 1), 14, yPosition);
            
            // Description
            doc.text(descLines, 30, yPosition);
            
            // Hours
            doc.text(service.hours.toFixed(2), 100, yPosition, { align: 'right' });
            
            // Unit Price
            doc.text(formatAmount(service.rate), 150, yPosition, { align: 'right' });
            
            // Amount
            doc.text(formatAmount(amount), 190, yPosition, { align: 'right' });
            
            yPosition += rowHeight;

            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        });
        
        yPosition += 3;
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 8;
        
        // Totals section with better formatting
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        await addTextToPdf(doc, t.subtotal + ':', 135, yPosition, { 
            fontSize: 10, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const currencyForSubtotal3 = country === 'japan' ? 'JPY' : 'INR';
        doc.text(currencyForSubtotal3 + ' ' + formatAmount(subTotal), 196, yPosition, { align: 'right' });
        yPosition += 8;
        
        // Display tax based on country
        if (country === 'japan' && consumptionTaxRate && consumptionTaxRate > 0) {
            // Japan: Consumption Tax
            doc.setFont('helvetica', 'bold');
            await addTextToPdf(doc, `${t.consumptionTax} (${consumptionTaxRate.toFixed(2)}%):`, 135, yPosition, { 
                fontSize: 10, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 50 
            });
            doc.setFont('helvetica', 'normal');
            doc.text('JPY ' + formatAmount(consumptionTaxAmount || 0), 196, yPosition, { align: 'right' });
            yPosition += 8;
        } else {
            // India: CGST & SGST
            if (cgstRate && cgstRate > 0) {
                doc.setFont('helvetica', 'bold');
                await addTextToPdf(doc, `${t.cgst} (${cgstRate.toFixed(2)}%):`, 135, yPosition, { 
                    fontSize: 10, 
                    fontStyle: 'bold', 
                    align: 'right', 
                    language,
                    maxWidth: 50 
                });
                doc.setFont('helvetica', 'normal');
                doc.text('INR ' + formatAmount(cgstAmount || 0), 196, yPosition, { align: 'right' });
            yPosition += 8;
        }
        
            if (sgstRate && sgstRate > 0) {
                doc.setFont('helvetica', 'bold');
                await addTextToPdf(doc, `${t.sgst} (${sgstRate.toFixed(2)}%):`, 135, yPosition, { 
                    fontSize: 10, 
                    fontStyle: 'bold', 
                    align: 'right', 
                    language,
                    maxWidth: 50 
                });
                doc.setFont('helvetica', 'normal');
                doc.text('INR ' + formatAmount(sgstAmount || 0), 196, yPosition, { align: 'right' });
            yPosition += 8;
        }
        }
        
        // Grand Total with emphasis
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.line(135, yPosition - 2, 196, yPosition - 2);
        yPosition += 3;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        await addTextToPdf(doc, t.grandTotal + ':', 135, yPosition, { 
            fontSize: 12, 
            fontStyle: 'bold', 
            align: 'right', 
            language,
            maxWidth: 30 
        });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const currencyForGrandTotal3 = country === 'japan' ? 'JPY' : 'INR';
        doc.text(currencyForGrandTotal3 + ' ' + formatAmount(grandTotal), 196, yPosition, { align: 'right' });
        yPosition += 15;

        // Payment Details section (for English)
        if (language === 'en') {
            yPosition += 10;
            await addTextToPdf(doc, t.paymentInstructions, 14, yPosition, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                language,
                maxWidth: 100 
            });
            yPosition += 7;
            // Use dynamic bank details from companyInfo
            const companyInfoToUse3 = companyInfoParam || getCompanyInfo();
            const bankDetails = companyInfoToUse3?.bankDetails;
            const accountName = bankDetails?.accountHolderName || companyInfoToUse3?.companyName || 'Ory Folks Pvt Ltd';
            const accountNumber = bankDetails?.accountNumber || '123456789012';
            const ifscCode = bankDetails?.ifscCode || 'HDFC0001234';
            const branchCode = bankDetails?.branchCode || '01234';
            
            await addTextToPdf(doc, `${t.accountName} ${accountName}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountNumber} ${accountNumber}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.ifsc} ${ifscCode}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            if (branchCode) {
                await addTextToPdf(doc, `${t.branchCode} ${branchCode}`, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
                yPosition += 6;
            }
            yPosition += 6;
            await addTextToPdf(doc, t.paymentNote, 14, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 15;
        }

        // Authorised Signature (bottom right)
        const sigY = Math.min(yPosition + 10, 270);
        doc.line(130, sigY, 196, sigY);
        await addTextToPdf(doc, t.authorisedSignature, 163, sigY + 6, { 
            fontSize: 9, 
            align: 'right', 
            language,
            maxWidth: 60 
        });
        yPosition = sigY + 15;

        // Add final thank you note and company seal for Japanese
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        if (language === 'ja') {
            yPosition += 15;
            await addTextToPdf(doc, t.thankYouMessage, 105, yPosition, { 
                fontSize: 9, 
                align: 'center', 
                language,
                maxWidth: 182 
            });
            
            // Add company seal area for Japanese documents
            yPosition += 10;
            await addTextToPdf(doc, t.companySeal, 160, yPosition, { 
                fontSize: 9, 
                fontStyle: 'bold', 
                align: 'right', 
                language,
                maxWidth: 60 
            });
            
            // Add payment instructions in Japanese
            yPosition += 15;
            await addTextToPdf(doc, t.paymentInstructions, 14, yPosition, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.bankName} 三菱UFJ銀行`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.branchName} 東京支店`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountType} 普通預金`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountNumber} 1234567`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `${t.accountName} 株式会社オライフォークス`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, t.paymentNote, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            
            // Add contact information
            yPosition += 12;
            await addTextToPdf(doc, t.contactInfo, 14, yPosition, { 
                fontSize: 11, 
                fontStyle: 'bold', 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            await addTextToPdf(doc, `TEL: 03-1234-5678 ${t.phoneHours}`, 20, yPosition, { 
                fontSize: 10, 
                language,
                maxWidth: 100 
            });
            yPosition += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Email: info@oryfolks.co.jp', 20, yPosition);
        } else {
            await addTextToPdf(doc, t.thankYou, 105, yPosition, { 
                fontSize: 9, 
                align: 'center', 
                language,
                maxWidth: 182 
            });
        }

        // Save the PDF with language suffix and appropriate filename
        // Ensure all async operations are complete before saving
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const langSuffix = language === 'ja' ? '_ja' : '';
        const fileName = language === 'ja' 
            ? `請求書_${invoice.invoiceNumber}.pdf` 
            : `invoice_${invoice.invoiceNumber}.pdf`;
            
        // Simple save with proper MIME type
        const pdfData = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfData);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);
        }, 100);
        
        console.log('PDF saved successfully:', fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};