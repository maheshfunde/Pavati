package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardResponse {

    private Double todaySales;
    private Double todayCollection;
    private Double totalPendingAmount;
    private Long totalCustomers;
    private List<LowStockProduct> lowStockProducts;

    @Data
    @Builder
    public static class LowStockProduct {
        private String name;
        private Integer stockQuantity;
    }
}