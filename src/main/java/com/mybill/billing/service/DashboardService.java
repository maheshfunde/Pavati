package com.mybill.billing.service;

import com.mybill.billing.dto.DashboardResponse;
import com.mybill.billing.entity.Product;
import com.mybill.billing.repository.*;
import com.mybill.billing.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BillRepository billRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final SecurityUtils securityUtils;

    public DashboardResponse getDashboard() {

        Long shopId = securityUtils.getCurrentShopId();

        LocalDate today = LocalDate.now();

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        Double todaySales =
                billRepository.getTodaySales(shopId, start, end);

        Double todayCollection =
                billRepository.getTodayCollection(shopId, start, end);

        Double pending =
                billRepository.getTotalPendingAmount(shopId);

        Long totalCustomers =
                customerRepository.countByShopId(shopId);

        List<Product> lowStock =
                productRepository
                        .findByShopIdAndStockQuantityLessThan(
                                shopId, 5);

        List<DashboardResponse.LowStockProduct> lowStockProducts =
                lowStock.stream()
                        .map(p -> DashboardResponse.LowStockProduct
                                .builder()
                                .name(p.getName())
                                .stockQuantity(p.getStockQuantity())
                                .build())
                        .toList();

        return DashboardResponse.builder()
                .todaySales(todaySales)
                .todayCollection(todayCollection)
                .totalPendingAmount(pending)
                .totalCustomers(totalCustomers)
                .lowStockProducts(lowStockProducts)
                .build();
    }
}
