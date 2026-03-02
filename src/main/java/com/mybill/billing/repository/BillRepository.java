package com.mybill.billing.repository;

import com.mybill.billing.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByShopId(Long shopId);
    List<Bill> findByShopIdAndStatus(Long shopId, String status);
    @Query("""
SELECT COALESCE(SUM(b.paidAmount),0)
FROM Bill b
WHERE b.shop.id = :shopId
AND b.createdAt BETWEEN :start AND :end
""")
    Double getSalesBetween(Long shopId,
                           LocalDateTime start,
                           LocalDateTime end);

    @Query("""
SELECT COALESCE(SUM(b.totalAmount - b.paidAmount),0)
FROM Bill b
WHERE b.shop.id = :shopId
AND b.status <> 'FULL'
""")
    Double getPendingAmount(Long shopId);

    @Query("""
SELECT COUNT(b)
FROM Bill b
WHERE b.shop.id = :shopId
AND b.createdAt BETWEEN :start AND :end
""")
    Long countBillsBetween(Long shopId,
                           LocalDateTime start,
                           LocalDateTime end);

    List<Bill> findByShopIdAndCustomerId(
            Long shopId,
            Long customerId);

    List<Bill> findByShopIdAndCustomer_NameContainingIgnoreCase(
            Long shopId,
            String customerName);

    List<Bill> findByShopIdAndStatusIn(
            Long shopId,
            List<String> statuses);

    Optional<Bill> findByIdAndShopId(
            Long id,
            Long shopId);

    List<Bill> findByCustomerIdAndShopIdOrderByCreatedAtAsc(
            Long customerId,
            Long shopId);

    @Query("""
SELECT COALESCE(SUM(b.totalAmount), 0)
FROM Bill b
WHERE b.shop.id = :shopId
AND b.createdAt >= :start
AND b.createdAt < :end
""")
    Double getTodaySales(
            @Param("shopId") Long shopId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);


    @Query("""
SELECT COALESCE(SUM(b.paidAmount), 0)
FROM Bill b
WHERE b.shop.id = :shopId
AND b.createdAt >= :start
AND b.createdAt < :end
""")
    Double getTodayCollection(
            @Param("shopId") Long shopId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
SELECT COALESCE(SUM(b.totalAmount - b.paidAmount),0)
FROM Bill b
WHERE b.shop.id = :shopId
""")
    Double getTotalPendingAmount(@Param("shopId") Long shopId);


}
