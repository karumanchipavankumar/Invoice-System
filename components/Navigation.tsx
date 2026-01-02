import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../src/assets/oryfolks-logo.svg';
import { parseExcelToInvoices } from '../services/excelService';
import { Invoice } from '../types';
import { generateInvoicePDF } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
    onExcelInvoicesParsed?: (invoices: Invoice[]) => void;
    onExcelError?: (error: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onExcelInvoicesParsed, onExcelError }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, companyInfo, logout } = useAuth();
    
    // Reset logo error when companyInfo changes
    React.useEffect(() => {
        setLogoError(false);
    }, [companyInfo?.companyLogoUrl]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [excelInvoices, setExcelInvoices] = useState<Invoice[]>([]);
    const [showExcelModal, setShowExcelModal] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ja'>('en');
    const [unitRate, setUnitRate] = useState<string>('');
    const [isGeneratingPDFs, setIsGeneratingPDFs] = useState(false);
    const [logoError, setLogoError] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            
            if (!validExtensions.includes(fileExtension)) {
                onExcelError?.('Please select a valid Excel file (.xlsx, .xls, or .csv)');
                return;
            }
            
            setSelectedFile(file);
            handleUpload(file);
        }
    };

    const handleUpload = async (file: File) => {
        setIsProcessing(true);
        try {
            const invoices = await parseExcelToInvoices(file);
            setExcelInvoices(invoices);
            setShowExcelModal(true);
            setUnitRate(''); // Reset unit rate
            setSelectedFile(null);
            onExcelInvoicesParsed?.(invoices);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to parse Excel file';
            onExcelError?.(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };


    const handleGeneratePDFs = async () => {
        // Validate unit rate
        const rate = parseFloat(unitRate);
        if (isNaN(rate) || rate <= 0) {
            alert('Please enter a valid unit rate (greater than 0)');
            return;
        }

        setIsGeneratingPDFs(true);
        try {
            // Apply unit rate to all services in all invoices
            const updatedInvoices = excelInvoices.map(invoice => ({
                ...invoice,
                services: invoice.services.map(service => ({
                    ...service,
                    rate: rate // Apply the unit rate to all services
                }))
            }));

            // Generate PDFs for all invoices - with proper delays to avoid browser blocking
            for (let i = 0; i < updatedInvoices.length; i++) {
                const invoice = updatedInvoices[i];
                try {
                    await generateInvoicePDF(invoice, selectedLanguage);
                    // Add delay between downloads to prevent browser blocking (longer delay for multiple files)
                    if (i < updatedInvoices.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
            }
                } catch (error) {
                    console.error(`Error generating PDF for invoice ${invoice.invoiceNumber}:`, error);
                }
            }
            
            alert(`Successfully generated ${updatedInvoices.length} PDF(s) with unit rate of ${rate}!`);
            setShowExcelModal(false);
            setExcelInvoices([]);
            setUnitRate('');
        } catch (error) {
            console.error('Error generating PDFs:', error);
            alert('Failed to generate some PDFs. Please check the console for details.');
        } finally {
            setIsGeneratingPDFs(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60 border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Company Logo with Fallback */}
                            {isAuthenticated && companyInfo ? (
                                <>
                                    {companyInfo.companyLogoUrl && !logoError ? (
                                        <img 
                                            src={companyInfo.companyLogoUrl.startsWith('http') 
                                                ? companyInfo.companyLogoUrl 
                                                : `${import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'http://localhost:8080'}${companyInfo.companyLogoUrl.startsWith('/') ? companyInfo.companyLogoUrl : '/' + companyInfo.companyLogoUrl}`}
                                            alt={`${companyInfo.companyName} Logo`}
                                            className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0"
                                            onError={() => {
                                                // Fallback to initial letter avatar if company logo fails to load
                                                setLogoError(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg sm:text-xl">
                                                {companyInfo.companyName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent truncate">
                                            {companyInfo.companyName}
                                        </h1>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{t('app.subtitle')}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <img src={logo} alt="OryFolks Logo" className="h-10 w-auto sm:h-12 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent truncate">
                                    {t('app.title')}
                                </h1>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{t('app.subtitle')}</p>
                                    </div>
                                </>
                            )}
                            </div>
                        
                        <nav className="flex items-center gap-2 sm:gap-3">
                            {isAuthenticated && (
                                <>
                                    {/* User info - only show email, company name is in logo area */}
                                    <div className="text-xs sm:text-sm text-gray-600 hidden md:block truncate max-w-[150px]">
                                        {user?.email}
                        </div>
                        
                                    {/* Logout Button */}
                                    <button
                                        onClick={logout}
                                        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600"
                                        title="Logout"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                            <span className="hidden sm:inline">Logout</span>
                                    </span>
                                    </button>
                                </>
                            )}
                            
                            {/* Excel Upload Button - Attractive Design */}
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="excel-upload-input"
                                    disabled={isProcessing}
                                />
                                <label
                                    htmlFor="excel-upload-input"
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                                        isProcessing
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:from-emerald-600 hover:via-green-600 hover:to-teal-600'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-sm">Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <span className="text-sm">Upload Excel File</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Unit Rate Input Modal */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 transition-opacity duration-200 z-50 ${showExcelModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-200 ${showExcelModal ? 'scale-100' : 'scale-95'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Enter Unit Rate
                        </h3>
                        <button
                            onClick={() => {
                                setShowExcelModal(false);
                                setExcelInvoices([]);
                                setUnitRate('');
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isGeneratingPDFs}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Found <span className="font-semibold text-blue-600">{excelInvoices.length}</span> invoice(s) in the Excel file.
                            Please enter the unit rate to apply to all services.
                        </p>
                        
                        <div className="mb-4">
                            <label htmlFor="unit-rate-input" className="block text-sm font-medium text-gray-700 mb-2">
                                Unit Rate (per hour)
                            </label>
                            <input
                                id="unit-rate-input"
                                type="number"
                                step="0.01"
                                min="0"
                                value={unitRate}
                                onChange={(e) => setUnitRate(e.target.value)}
                                placeholder="Enter unit rate"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isGeneratingPDFs}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Language
                            </label>
                            <div className="flex gap-2">
                        <button
                                    onClick={() => setSelectedLanguage('en')}
                                    disabled={isGeneratingPDFs}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                        selectedLanguage === 'en'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } ${isGeneratingPDFs ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    English
                        </button>
                        <button
                                    onClick={() => setSelectedLanguage('ja')}
                                    disabled={isGeneratingPDFs}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                        selectedLanguage === 'ja'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } ${isGeneratingPDFs ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    日本語
                        </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                                        <button
                            onClick={() => {
                                setShowExcelModal(false);
                                setExcelInvoices([]);
                                setUnitRate('');
                            }}
                            disabled={isGeneratingPDFs}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                            Cancel
                                        </button>
                                        <button
                            onClick={handleGeneratePDFs}
                            disabled={!unitRate || isGeneratingPDFs}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                            {isGeneratingPDFs ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate PDFs'
                            )}
                                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

