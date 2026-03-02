package com.mybill.billing.controller;

import com.mybill.billing.entity.Shop;
import com.mybill.billing.security.SecurityUtils;
import com.mybill.billing.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public Shop createShop(@RequestBody Shop shop) {
        return shopService.createShop(shop);
    }
    @GetMapping("/shop-to-test")
    public Long getShop() {
        return securityUtils.getCurrentShopId();
    }
}
