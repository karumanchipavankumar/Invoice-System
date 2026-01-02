import React from 'react';

export interface BankDetailsFormData {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    branchName: string;
    branchCode: string;
}

interface BankDetailsFormProps {
    data: BankDetailsFormData;
    onChange: (data: BankDetailsFormData) => void;
    errors?: Partial<Record<keyof BankDetailsFormData, string>>;
}

export const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ data, onChange, errors = {} }) => {
    const updateField = (field: keyof BankDetailsFormData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4 border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="bankName"
                        type="text"
                        value={data.bankName}
                        onChange={(e) => updateField('bankName', e.target.value)}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.bankName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter bank name"
                    />
                    {errors.bankName && (
                        <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="accountNumber"
                        type="text"
                        value={data.accountNumber}
                        onChange={(e) => updateField('accountNumber', e.target.value)}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter account number"
                    />
                    {errors.accountNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="accountHolderName"
                        type="text"
                        value={data.accountHolderName}
                        onChange={(e) => updateField('accountHolderName', e.target.value)}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter account holder name"
                    />
                    {errors.accountHolderName && (
                        <p className="mt-1 text-sm text-red-600">{errors.accountHolderName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="ifscCode"
                        type="text"
                        value={data.ifscCode}
                        onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.ifscCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter IFSC code"
                    />
                    {errors.ifscCode && (
                        <p className="mt-1 text-sm text-red-600">{errors.ifscCode}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name
                    </label>
                    <input
                        id="branchName"
                        type="text"
                        value={data.branchName}
                        onChange={(e) => updateField('branchName', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter branch name"
                    />
                </div>

                <div>
                    <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Code
                    </label>
                    <input
                        id="branchCode"
                        type="text"
                        value={data.branchCode}
                        onChange={(e) => updateField('branchCode', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter branch code"
                    />
                </div>
            </div>
        </div>
    );
};

