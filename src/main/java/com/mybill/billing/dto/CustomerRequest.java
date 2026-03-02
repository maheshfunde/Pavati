package com.mybill.billing.dto;

import lombok.Data;

@Data
public class CustomerRequest {

    private String name;
    private String mobile;
    private String address;
}