package com.mybill.billing.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateBillRequest {

    private Long customerId;
    private List<Item> items;

    @Data
    public static class Item {
        private Long productId;
        private Integer quantity;
    }
}