package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerResponse {

    private Long id;
    private String name;
    private String mobile;
    private String address;
}