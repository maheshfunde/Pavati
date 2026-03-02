package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CustomerLedgerResponse {

    private String customerName;
    private Double balance;
    private List<Entry> entries;

    @Data
    @Builder
    public static class Entry {

        private LocalDateTime date;
        private String type; // BILL / PAYMENT
        private Double amount;
        private String invoiceCode;
    }
}
