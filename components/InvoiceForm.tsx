import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Invoice, ServiceItem } from '../types';
import { useCountry } from '../contexts/CountryContext';
import { calculateTax } from '../services/countryPreferenceService';

interface InvoiceFormProps {
    onSave: (invoice: Invoice) => void;
    selectedInvoice?: Invoice | null;
    clearSelection: () => void;
    invoicesCount: number;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
    onSave,
    selectedInvoice,
    clearSelection,
    invoicesCount
}) => {
    const { t } = useTranslation();
    const { country } = useCountry();
    
    const [formData, setFormData] = useState<Partial<Invoice>>({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        company: 'Ory Folks Pvt Ltd',
        employeeName: '',
        employeeId: '',
        employeeEmail: '',
        employeeAddress: '',
        employeeMobile: '',
        services: [],
        taxRate: 10,
        country: country
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Generate invoice number if creating new invoice
    useEffect(() => {
        if (!selectedInvoice) {
            const invoiceNumber = `INV-${String(invoicesCount + 1).padStart(4, '0')}`;
            setFormData(prev => ({ ...prev, invoiceNumber }));
        }
    }, [selectedInvoice, invoicesCount]);

    // Load selected invoice data
    useEffect(() => {
        if (selectedInvoice) {
            setFormData({
                ...selectedInvoice,
                country: selectedInvoice.country || country
            });
        }
    }, [selectedInvoice, country]);

    // Update country when it changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, country }));
    }, [country]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleServiceChange = (index: number, field: keyof ServiceItem, value: string | number) => {
        setFormData(prev => {
            const services = [...(prev.services || [])];
            services[index] = { ...services[index], [field]: value };
            return { ...prev, services };
        });
    };

    const addService = () => {
        setFormData(prev => ({
            ...prev,
            services: [
                ...(prev.services || []),
                {
                    id: `service-${Date.now()}`,
                    description: '',
                    hours: 0,
                    rate: 0
                }
            ]
        }));
    };

    const removeService = (index: number) => {
        setFormData(prev => {
            const services = [...(prev.services || [])];
            services.splice(index, 1);
            return { ...prev, services };
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.employeeName?.trim()) {
            newErrors.employeeName = t('form.required');
        }
        if (!formData.employeeId?.trim()) {
            newErrors.employeeId = t('form.required');
        }
        if (!formData.employeeEmail?.trim()) {
            newErrors.employeeEmail = t('form.required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employeeEmail)) {
            newErrors.employeeEmail = t('form.invalidEmail');
        }
        if (!formData.employeeAddress?.trim()) {
            newErrors.employeeAddress = t('form.required');
        }
        if (!formData.employeeMobile?.trim()) {
            newErrors.employeeMobile = t('form.required');
        }
        if (!formData.date) {
            newErrors.date = t('form.required');
        }
        if (!formData.services || formData.services.length === 0) {
            newErrors.services = 'At least one service is required';
        } else {
            formData.services.forEach((service, index) => {
                if (!service.description?.trim()) {
                    newErrors[`service-${index}-description`] = 'Description is required';
                }
                if (service.hours <= 0) {
                    newErrors[`service-${index}-hours`] = 'Hours must be greater than 0';
                }
                if (service.rate <= 0) {
                    newErrors[`service-${index}-rate`] = 'Rate must be greater than 0';
                }
            });
        }
        if (formData.taxRate === undefined || formData.taxRate < 0) {
            newErrors.taxRate = 'Tax rate is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }

        const invoice: Invoice = {
            id: selectedInvoice?.id || `invoice-${Date.now()}`,
            invoiceNumber: formData.invoiceNumber || `INV-${String(invoicesCount + 1).padStart(4, '0')}`,
            date: formData.date || new Date().toISOString().split('T')[0],
            dueDate: formData.dueDate || '',
            company: formData.company || 'Ory Folks Pvt Ltd',
            employeeName: formData.employeeName || '',
            employeeId: formData.employeeId || '',
            employeeEmail: formData.employeeEmail || '',
            employeeAddress: formData.employeeAddress || '',
            employeeMobile: formData.employeeMobile || '',
            services: formData.services || [],
            taxRate: formData.taxRate || 0,
            country: formData.country || country
        };

        onSave(invoice);
    };

    // Calculate totals
    const subTotal = (formData.services || []).reduce((sum, s) => sum + (s.hours * s.rate), 0);
    const taxCalculation = calculateTax(subTotal, formData.taxRate || 0, formData.country || country);
    const grandTotal = taxCalculation.grandTotal;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Number and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Number
                    </label>
                    <input
                        type="text"
                        name="invoiceNumber"
                        value={formData.invoiceNumber || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        readOnly={!!selectedInvoice}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('invoice.date')} *
                    </label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.date ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                    />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('invoice.dueDate')}
                    </label>
                    <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Employee Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('invoice.to')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('invoice.employeeId')} *
                        </label>
                        <input
                            type="text"
                            name="employeeId"
                            value={formData.employeeId || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.employeeId ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employee Name *
                        </label>
                        <input
                            type="text"
                            name="employeeName"
                            value={formData.employeeName || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.employeeName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('invoice.email')} *
                        </label>
                        <input
                            type="email"
                            name="employeeEmail"
                            value={formData.employeeEmail || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.employeeEmail ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.employeeEmail && <p className="text-red-500 text-xs mt-1">{errors.employeeEmail}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('invoice.phone')} *
                        </label>
                        <input
                            type="tel"
                            name="employeeMobile"
                            value={formData.employeeMobile || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.employeeMobile ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.employeeMobile && <p className="text-red-500 text-xs mt-1">{errors.employeeMobile}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('invoice.address')} *
                        </label>
                        <textarea
                            name="employeeAddress"
                            value={formData.employeeAddress || ''}
                            onChange={handleChange}
                            rows={2}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.employeeAddress ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        />
                        {errors.employeeAddress && <p className="text-red-500 text-xs mt-1">{errors.employeeAddress}</p>}
                    </div>
                </div>
            </div>

            {/* Services */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{t('invoice.description')}</h3>
                    <button
                        type="button"
                        onClick={addService}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Add Service
                    </button>
                </div>
                {errors.services && <p className="text-red-500 text-xs mb-2">{errors.services}</p>}
                <div className="space-y-4">
                    {(formData.services || []).map((service, index) => (
                        <div key={service.id || index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice.description')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={service.description}
                                        onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors[`service-${index}-description`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                    />
                                    {errors[`service-${index}-description`] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[`service-${index}-description`]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice.hours')} *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={service.hours}
                                        onChange={(e) => handleServiceChange(index, 'hours', parseFloat(e.target.value) || 0)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors[`service-${index}-hours`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                    />
                                    {errors[`service-${index}-hours`] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[`service-${index}-hours`]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('invoice.unitPrice')} *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={service.rate}
                                        onChange={(e) => handleServiceChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors[`service-${index}-rate`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                    />
                                    {errors[`service-${index}-rate`] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[`service-${index}-rate`]}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => removeService(index)}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tax Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Rate (%) *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="taxRate"
                        value={formData.taxRate || 0}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.taxRate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                    />
                    {errors.taxRate && <p className="text-red-500 text-xs mt-1">{errors.taxRate}</p>}
                </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium">{t('invoice.subtotal')}:</span>
                        <span>{country === 'japan' ? 'JPY' : 'INR'} {subTotal.toFixed(2)}</span>
                    </div>
                    {country === 'japan' ? (
                        taxCalculation.consumptionTaxRate && taxCalculation.consumptionTaxRate > 0 && (
                            <div className="flex justify-between">
                                <span className="font-medium">{t('invoice.consumptionTax')} ({taxCalculation.consumptionTaxRate.toFixed(2)}%):</span>
                                <span>JPY {taxCalculation.consumptionTaxAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                        )
                    ) : (
                        <>
                            {taxCalculation.cgstRate && taxCalculation.cgstRate > 0 && (
                                <div className="flex justify-between">
                                    <span className="font-medium">{t('invoice.cgst')} ({taxCalculation.cgstRate.toFixed(2)}%):</span>
                                    <span>INR {taxCalculation.cgstAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                            )}
                            {taxCalculation.sgstRate && taxCalculation.sgstRate > 0 && (
                                <div className="flex justify-between">
                                    <span className="font-medium">{t('invoice.sgst')} ({taxCalculation.sgstRate.toFixed(2)}%):</span>
                                    <span>INR {taxCalculation.sgstAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>{t('invoice.grandTotal')}:</span>
                        <span>{country === 'japan' ? 'JPY' : 'INR'} {grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    {selectedInvoice ? t('app.actions.save') : 'Create Invoice'}
                </button>
                {selectedInvoice && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        {t('app.actions.cancel')}
                    </button>
                )}
            </div>
        </form>
    );
};

