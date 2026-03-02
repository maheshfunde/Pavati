package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BillItemResponse {

    private String productName;
    private Double price;
    private Integer quantity;
}
