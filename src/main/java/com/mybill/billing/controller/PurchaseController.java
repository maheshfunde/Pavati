package com.mybill.billing.controller;

import com.mybill.billing.dto.PurchaseRequest;
import com.mybill.billing.dto.PurchaseResponse;
import com.mybill.billing.service.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping
    public PurchaseResponse createPurchase(
            @RequestBody PurchaseRequest request) {

        return purchaseService.createPurchase(request);
    }

    @GetMapping
    public List<PurchaseResponse> getPurchases() {
        return purchaseService.getPurchases();
    }
}
