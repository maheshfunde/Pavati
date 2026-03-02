package com.mybill.billing.dto;

import lombok.Data;

@Data
public class RegisterRequest {

    private String shopName;
    private String ownerName;
    private String mobile;

    private String username;
    private String password;
}
