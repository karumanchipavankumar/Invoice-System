export interface ServiceItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

export type Country = 'india' | 'japan';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  company: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  employeeAddress: string;
  employeeMobile: string;
  services: ServiceItem[];
  taxRate?: number;
  cgstRate?: number;
  sgstRate?: number;
  country?: Country; // Country for tax calculation
}

// Company and Bank Details Types
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  branchName?: string;
  branchCode?: string;
}

export interface CompanyInfo {
  id: string;
  companyName: string;
  companyAddress: string;
  companyLogoUrl: string;
  bankDetails: BankDetails;
}
