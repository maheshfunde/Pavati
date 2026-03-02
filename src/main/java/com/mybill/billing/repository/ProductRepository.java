package com.mybill.billing.repository;

import com.mybill.billing.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    Optional<Product> findByIdAndShopId(
            Long id,
            Long shopId);

    // Tenant-safe listing
    List<Product> findByShopId(Long shopId);

    // Optional search
    List<Product> findByShopIdAndNameContainingIgnoreCase(
            Long shopId,
            String name);
    List<Product> findByShopIdAndStockQuantityLessThan(
            Long shopId,
            Integer stock);
}
