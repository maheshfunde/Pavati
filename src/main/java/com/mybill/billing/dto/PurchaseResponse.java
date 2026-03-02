package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PurchaseResponse {

    private Long id;
    private String supplierName;
    private LocalDateTime purchaseDate;
    private List<Item> items;

    @Data
    @Builder
    public static class Item {
        private String productName;
        private Integer quantity;
        private Double purchasePrice;
    }
}