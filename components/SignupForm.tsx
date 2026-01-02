import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from './ImageUpload';
import { BankDetailsForm, BankDetailsFormData } from './BankDetailsForm';
import { checkBackendHealth } from '../services/authService';

const API_URL = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'http://localhost:8080';

export const SignupForm: React.FC = () => {
    const { signup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyLogo, setCompanyLogo] = useState<File | null>(null);
    const [bankDetails, setBankDetails] = useState<BankDetailsFormData>({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        branchName: '',
        branchCode: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Check backend status on component mount
    useEffect(() => {
        const checkBackend = async () => {
            setBackendStatus('checking');
            const isHealthy = await checkBackendHealth();
            setBackendStatus(isHealthy ? 'online' : 'offline');
        };
        checkBackend();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
        
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        
        if (!companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!companyAddress.trim()) newErrors.companyAddress = 'Company address is required';
        
        if (!bankDetails.bankName.trim()) newErrors.bankName = 'Bank name is required';
        if (!bankDetails.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
        if (!bankDetails.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
        if (!bankDetails.ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrors({});

        if (!validateForm()) {
            const errorFields = Object.keys(errors);
            if (errorFields.length > 0) {
                const fieldNames = errorFields.map(field => {
                    const labels: Record<string, string> = {
                        name: 'Full Name',
                        email: 'Email',
                        password: 'Password',
                        confirmPassword: 'Confirm Password',
                        companyName: 'Company Name',
                        companyAddress: 'Company Address',
                        bankName: 'Bank Name',
                        accountNumber: 'Account Number',
                        accountHolderName: 'Account Holder Name',
                        ifscCode: 'IFSC Code',
                    };
                    return labels[field] || field;
                });
                setError(`Please fill in the following required fields: ${fieldNames.join(', ')}`);
            } else {
                setError('Please fix the errors in the form');
            }
            return;
        }

        setIsLoading(true);

        try {
            await signup({
                email,
                password,
                name,
                companyName,
                companyAddress,
                companyLogo,
                bankDetails: {
                    bankName: bankDetails.bankName.trim(),
                    accountNumber: bankDetails.accountNumber.trim(),
                    accountHolderName: bankDetails.accountHolderName.trim(),
                    ifscCode: bankDetails.ifscCode.trim(),
                    branchName: bankDetails.branchName?.trim() || undefined,
                    branchCode: bankDetails.branchCode?.trim() || undefined,
                },
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
            setError(errorMessage);
            
            // If it's a validation error from backend, try to extract field-specific errors
            if (errorMessage.includes('required') || errorMessage.includes('must be')) {
                // Highlight which fields might be missing
                const missingFields: string[] = [];
                if (errorMessage.toLowerCase().includes('email')) missingFields.push('email');
                if (errorMessage.toLowerCase().includes('password')) missingFields.push('password');
                if (errorMessage.toLowerCase().includes('name')) missingFields.push('name');
                if (errorMessage.toLowerCase().includes('company')) missingFields.push('companyName', 'companyAddress');
                if (errorMessage.toLowerCase().includes('bank')) missingFields.push('bankName', 'accountNumber', 'accountHolderName', 'ifscCode');
                
                // Update field errors
                const newErrors: Record<string, string> = { ...errors };
                missingFields.forEach(field => {
                    if (!newErrors[field]) {
                        newErrors[field] = 'This field is required';
                    }
                });
                setErrors(newErrors);
            }
            
            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Backend Status Indicator */}
            {backendStatus === 'checking' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-600"></div>
                        <p className="text-yellow-800 text-xs">Checking backend connection...</p>
                    </div>
                </div>
            )}
            {backendStatus === 'offline' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-red-800 font-medium text-sm mb-1">Backend Server Offline</p>
                            <p className="text-red-700 text-xs mb-2">The backend server is not reachable at {API_URL}</p>
                            <div className="bg-red-100 p-3 rounded mt-2">
                                <p className="text-red-800 text-xs font-medium mb-1">To start the backend:</p>
                                <ol className="text-red-700 text-xs list-decimal list-inside space-y-1">
                                    <li>Open PowerShell or Terminal</li>
                                    <li>Navigate to backend folder: <code className="bg-red-200 px-1 rounded">cd backend</code></li>
                                    <li>Run: <code className="bg-red-200 px-1 rounded">mvn spring-boot:run</code></li>
                                    <li>Wait for: <code className="bg-red-200 px-1 rounded">Started InvoiceManagementApplication</code></li>
                                </ol>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setBackendStatus('checking');
                                        const isHealthy = await checkBackendHealth();
                                        setBackendStatus(isHealthy ? 'online' : 'offline');
                                    }}
                                    className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {backendStatus === 'online' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-800 text-xs font-medium">Backend server is online and ready</p>
                    </div>
                </div>
            )}

            {/* Required Fields Info */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg">
                <p className="text-blue-800 text-xs font-medium mb-1">Required Fields:</p>
                <p className="text-blue-700 text-xs">
                    Personal: Name, Email, Password • Company: Name, Address • Bank: Bank Name, Account Number, Account Holder Name, IFSC Code
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-red-700 font-medium text-sm mb-1">Signup Failed</p>
                            <p className="text-red-600 text-sm">{error}</p>
                            {error.includes('connect to server') && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-red-600 text-xs font-medium">Troubleshooting:</p>
                                    <ul className="text-red-600 text-xs list-disc list-inside space-y-0.5">
                                        <li>Make sure the backend server is running on port 8080</li>
                                        <li>Check if the API URL is correct: {API_URL}</li>
                                        <li>Verify CORS settings in the backend</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div>
                    <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John Doe"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="your.email@example.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="At least 6 characters"
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="signup-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                
                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.companyName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Your Company Name"
                    />
                    {errors.companyName && (
                        <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="companyAddress"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.companyAddress ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter company address"
                    />
                    {errors.companyAddress && (
                        <p className="mt-1 text-sm text-red-600">{errors.companyAddress}</p>
                    )}
                </div>

                <ImageUpload
                    value={companyLogo}
                    onChange={setCompanyLogo}
                    label="Company Logo"
                    maxSizeMB={5}
                    error={errors.companyLogo}
                />
            </div>

            {/* Bank Details */}
            <BankDetailsForm
                data={bankDetails}
                onChange={setBankDetails}
                errors={{
                    bankName: errors.bankName,
                    accountNumber: errors.accountNumber,
                    accountHolderName: errors.accountHolderName,
                    ifscCode: errors.ifscCode,
                }}
            />

            <button
                type="submit"
                disabled={isLoading || backendStatus !== 'online'}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Creating account...' : backendStatus !== 'online' ? 'Backend Offline - Cannot Sign Up' : 'Sign Up'}
            </button>
        </form>
    );
};

