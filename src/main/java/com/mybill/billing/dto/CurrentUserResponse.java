package com.mybill.billing.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CurrentUserResponse {

    private String username;
    private String role;
    private String shopName;
}
