package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BillResponse {

    private Long id;
    private String customerName;
    private Double totalAmount;
    private Double paidAmount;
    private String status;
    private LocalDateTime createdAt;
    private Long invoiceNumber;
    private String invoiceCode;
    private Double remainingAmount;

    private List<BillItemResponse> items;
}
