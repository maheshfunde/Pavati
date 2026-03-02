package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StaffResponse {

    private Long id;
    private String username;
}
