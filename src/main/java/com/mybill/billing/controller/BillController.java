package com.mybill.billing.controller;

import com.mybill.billing.dto.BillResponse;
import com.mybill.billing.dto.CreateBillRequest;
import com.mybill.billing.dto.PaymentRequest;
import com.mybill.billing.entity.Bill;
import com.mybill.billing.service.BillService;
import com.mybill.billing.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;
    private final InvoiceService invoiceService;


    @PreAuthorize("hasAnyAuthority('OWNER','STAFF')")
    @PostMapping
    public BillResponse createBill(@RequestBody CreateBillRequest request) {
        return billService.createBill(request);
    }

    @GetMapping
    public List<BillResponse> getBills() {
        return billService.getBills();
    }

    @PutMapping("/{id}/payment")
    public BillResponse makePayment(
            @PathVariable Long id,
            @RequestBody PaymentRequest request) {

        return billService.makePayment(id, request);
    }
    @GetMapping("/pending")
    public List<BillResponse> getPendingBills() {
        return billService.getPendingBills();
    }
    @GetMapping("/search")
    public List<BillResponse> searchBills(
            @RequestParam String customerName) {

        return billService
                .searchBillsByCustomerName(customerName);
    }
    @GetMapping("/status")
    public List<BillResponse> getBillsByStatus(
            @RequestParam String status) {

        return billService.getBillsByStatus(status);
    }
    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> generateInvoice(
            @PathVariable Long id) throws Exception {

        byte[] pdf = invoiceService.generateInvoice(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=invoice_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/reminders")
    public List<BillResponse> getPendingBillsForReminder() {
        return billService.getPendingBillsForReminder();
    }

    @GetMapping("/{id}/reminder-message")
    public String getReminderMessage(
            @PathVariable Long id) {

        return billService.generateReminderMessage(id);
    }

    @GetMapping("/{id}/whatsapp-link")
    public String getWhatsappLink(@PathVariable Long id) {
        return billService.generateWhatsappLink(id);
    }
}
