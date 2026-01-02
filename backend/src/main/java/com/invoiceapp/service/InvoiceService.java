package com.invoiceapp.service;

import com.invoiceapp.dto.InvoiceDTO;
import com.invoiceapp.entity.Invoice;
import com.invoiceapp.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {
    
    @Autowired
    private InvoiceRepository invoiceRepository;
    
    public InvoiceDTO createInvoice(InvoiceDTO invoiceDTO) {
        System.out.println("Creating new invoice: " + invoiceDTO.getInvoiceNumber());
        
        Invoice invoice = convertToEntity(invoiceDTO);
        // Let MongoDB generate the ID for new invoices
        invoice.setId(null);
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        
        Invoice savedInvoice = invoiceRepository.save(invoice);
        System.out.println("Invoice saved with ID: " + savedInvoice.getId());
        return convertToDTO(savedInvoice);
    }
    
    public InvoiceDTO updateInvoice(String id, InvoiceDTO invoiceDTO) {
        System.out.println("Updating invoice: " + id);
        
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
        
        invoice.setInvoiceNumber(invoiceDTO.getInvoiceNumber());
        invoice.setDate(invoiceDTO.getDate());
        invoice.setEmployeeName(invoiceDTO.getEmployeeName());
        invoice.setEmployeeId(invoiceDTO.getEmployeeId());
        invoice.setEmployeeEmail(invoiceDTO.getEmployeeEmail());
        invoice.setEmployeeAddress(invoiceDTO.getEmployeeAddress());
        invoice.setEmployeeMobile(invoiceDTO.getEmployeeMobile());
        invoice.setServices(invoiceDTO.getServices());
        invoice.setTaxRate(invoiceDTO.getTaxRate());
        invoice.setUpdatedAt(LocalDateTime.now());
        
        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return convertToDTO(updatedInvoice);
    }
    
    public void deleteInvoice(String id) {
        System.out.println("Deleting invoice: " + id);
        invoiceRepository.deleteById(id);
    }
    
    public InvoiceDTO getInvoiceById(String id) {
        System.out.println("Fetching invoice: " + id);
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
        return convertToDTO(invoice);
    }
    
    public List<InvoiceDTO> getAllInvoices() {
        System.out.println("Fetching all invoices");
        return invoiceRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<InvoiceDTO> getInvoicesByEmployeeId(String employeeId) {
        System.out.println("Fetching invoices for employee: " + employeeId);
        return invoiceRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private Invoice convertToEntity(InvoiceDTO dto) {
        Invoice invoice = new Invoice();
        invoice.setId(dto.getId());
        invoice.setInvoiceNumber(dto.getInvoiceNumber());
        invoice.setDate(dto.getDate());
        invoice.setEmployeeName(dto.getEmployeeName());
        invoice.setEmployeeId(dto.getEmployeeId());
        invoice.setEmployeeEmail(dto.getEmployeeEmail());
        invoice.setEmployeeAddress(dto.getEmployeeAddress());
        invoice.setEmployeeMobile(dto.getEmployeeMobile());
        invoice.setServices(dto.getServices());
        invoice.setTaxRate(dto.getTaxRate());
        return invoice;
    }
    
    private InvoiceDTO convertToDTO(Invoice entity) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.setId(entity.getId());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setDate(entity.getDate());
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setEmployeeId(entity.getEmployeeId());
        dto.setEmployeeEmail(entity.getEmployeeEmail());
        dto.setEmployeeAddress(entity.getEmployeeAddress());
        dto.setEmployeeMobile(entity.getEmployeeMobile());
        dto.setServices(entity.getServices());
        dto.setTaxRate(entity.getTaxRate());
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        dto.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
        return dto;
    }
}
