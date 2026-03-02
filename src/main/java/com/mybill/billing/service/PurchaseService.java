package com.mybill.billing.service;

import com.mybill.billing.dto.PurchaseRequest;
import com.mybill.billing.dto.PurchaseResponse;
import com.mybill.billing.entity.*;
import com.mybill.billing.repository.*;
import com.mybill.billing.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final SecurityUtils securityUtils;

    public PurchaseResponse createPurchase(PurchaseRequest request) {

        Shop shop = shopRepository.findById(
                        securityUtils.getCurrentShopId())
                .orElseThrow();

        Purchase purchase = Purchase.builder()
                .supplierName(request.getSupplierName())
                .purchaseDate(LocalDateTime.now())
                .shop(shop)
                .build();

        List<PurchaseItem> items = new ArrayList<>();

        for (PurchaseRequest.Item i : request.getItems()) {

            Product product =
                    productRepository.findByIdAndShopId(
                                    i.getProductId(),
                                    shop.getId())
                            .orElseThrow();

            // 🔥 INCREASE STOCK
            product.setStockQuantity(
                    product.getStockQuantity()
                            + i.getQuantity());

            productRepository.save(product);

            PurchaseItem item = PurchaseItem.builder()
                    .product(product)
                    .quantity(i.getQuantity())
                    .purchasePrice(i.getPurchasePrice())
                    .purchase(purchase)
                    .build();

            items.add(item);
        }

        purchase.setItems(items);

        Purchase saved = purchaseRepository.save(purchase);
        return convert(saved);
    }
    private PurchaseResponse convert(Purchase purchase) {

        List<PurchaseResponse.Item> items =
                purchase.getItems()
                        .stream()
                        .map(i -> PurchaseResponse.Item.builder()
                                .productName(i.getProduct().getName())
                                .quantity(i.getQuantity())
                                .purchasePrice(i.getPurchasePrice())
                                .build())
                        .toList();

        return PurchaseResponse.builder()
                .id(purchase.getId())
                .supplierName(purchase.getSupplierName())
                .purchaseDate(purchase.getPurchaseDate())
                .items(items)
                .build();
    }
}
