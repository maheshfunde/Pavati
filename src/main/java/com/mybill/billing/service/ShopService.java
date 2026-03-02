package com.mybill.billing.service;

import com.mybill.billing.entity.Shop;
import com.mybill.billing.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;

    public Shop createShop(Shop shop) {
        shop.setCreatedAt(LocalDateTime.now());
        shop.setSubscriptionStatus("TRIAL");
        return shopRepository.save(shop);
    }
}
