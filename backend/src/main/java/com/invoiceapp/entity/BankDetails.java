package com.invoiceapp.entity;

public class BankDetails {
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private String ifscCode;
    private String branchName;
    private String branchCode;
    
    public BankDetails() {}
    
    public BankDetails(String bankName, String accountNumber, String accountHolderName, 
                      String ifscCode, String branchName, String branchCode) {
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolderName = accountHolderName;
        this.ifscCode = ifscCode;
        this.branchName = branchName;
        this.branchCode = branchCode;
    }
    
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    
    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }
    
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
}

