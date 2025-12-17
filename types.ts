
export interface ServiceItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  employeeAddress: string;
  employeeMobile: string;
  services: ServiceItem[];
  taxRate: number;
}
