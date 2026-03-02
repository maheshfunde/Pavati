package com.mybill.billing.dto;

import lombok.Data;

@Data
public class ProductRequest {

    private String name;
    private Double price;
    private Integer stockQuantity;
}
