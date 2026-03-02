package com.mybill.billing.controller;

import com.mybill.billing.dto.BillResponse;
import com.mybill.billing.dto.CustomerLedgerResponse;
import com.mybill.billing.dto.CustomerRequest;
import com.mybill.billing.dto.CustomerResponse;
import com.mybill.billing.entity.Customer;
import com.mybill.billing.service.BillService;
import com.mybill.billing.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final BillService billService;

    @PostMapping
    public CustomerResponse createCustomer(@RequestBody CustomerRequest request) {
        return customerService.createCustomer(request);
    }

    @GetMapping
    public List<CustomerResponse> getCustomers() {
        return customerService.getCustomers();
    }

    @GetMapping("/{id}/bills")
    public List<BillResponse> getCustomerBills(
            @PathVariable Long id) {

        return billService.getBillsByCustomer(id);
    }
    @GetMapping("/{id}/ledger")
    public CustomerLedgerResponse getLedger(
            @PathVariable Long id) {

        return billService.getCustomerLedger(id);
    }
}
