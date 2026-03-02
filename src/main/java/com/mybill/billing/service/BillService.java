package com.mybill.billing.service;

import com.mybill.billing.dto.*;
import com.mybill.billing.entity.*;
import com.mybill.billing.repository.BillRepository;
import com.mybill.billing.repository.ProductRepository;
import com.mybill.billing.repository.ShopRepository;
import com.mybill.billing.security.SecurityUtils;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Transactional
@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final SecurityUtils securityUtils;

    public BillResponse  createBill(CreateBillRequest request) {

        Shop shop = shopRepository.findById(
                        securityUtils.getCurrentShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found"));

        Customer customer = new Customer();
        customer.setId(request.getCustomerId());

        Bill bill = new Bill();
        bill.setCustomer(customer);
        bill.setShop(shop);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setPaidAmount(0.0);

        Long invoiceNumber = shop.getNextInvoiceNumber();
        bill.setInvoiceNumber(invoiceNumber);
        // Increment for next bill
        shop.setNextInvoiceNumber(invoiceNumber + 1);

        List<BillItem> items = new ArrayList<>();

        double total = 0;

        for (CreateBillRequest.Item i : request.getItems()) {

            Product product = productRepository
                    .findByIdAndShopId(
                            i.getProductId(),
                            securityUtils.getCurrentShopId())
                    .orElseThrow(() ->
                            new RuntimeException("Product not found"));

            if (product.getStockQuantity() < i.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for " + product.getName());
            }

            // Deduct stock
            product.setStockQuantity(
                    product.getStockQuantity() - i.getQuantity());

            productRepository.save(product);

            BillItem item = new BillItem();
            item.setProductName(product.getName());
            item.setPrice(product.getPrice());
            item.setQuantity(i.getQuantity());
            item.setBill(bill);

            total += product.getPrice() * i.getQuantity();

            items.add(item);
        }

        bill.setItems(items);
        bill.setTotalAmount(total);
        bill.setStatus("PENDING");

        shopRepository.save(shop);

        Bill saved = billRepository.save(bill);


        return convertToResponse(saved);
    }

    public List<BillResponse> getBills() {

        List<Bill> bills =
                billRepository.findByShopId(securityUtils.getCurrentShopId());

        return bills.stream()
                .map(this::convertToResponse)
                .toList();
    }

    private BillResponse convertToResponse(Bill bill) {
        List<BillItemResponse> itemResponses =
                bill.getItems().stream()
                        .map(item -> BillItemResponse.builder()
                                .productName(item.getProductName())
                                .price(item.getPrice())
                                .quantity(item.getQuantity())
                                .build())
                        .toList();

        return BillResponse.builder()
                .id(bill.getId())
                .invoiceNumber(bill.getInvoiceNumber())
                .invoiceCode(
                        generateInvoiceCode(
                                bill.getShop(),
                                bill.getInvoiceNumber()
                        )
                )
                .customerName(bill.getCustomer().getName())
                .totalAmount(bill.getTotalAmount())
                .remainingAmount(
                        bill.getTotalAmount() - bill.getPaidAmount()
                )
                .paidAmount(bill.getPaidAmount())
                .status(bill.getStatus())
                .createdAt(bill.getCreatedAt())
                .items(itemResponses)
                .build();
    }
    public BillResponse makePayment(Long billId,
                                    PaymentRequest request) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        // SECURITY CHECK (VERY IMPORTANT)
        if (!bill.getShop().getId()
                .equals(securityUtils.getCurrentShopId())) {
            throw new RuntimeException("Unauthorized access");
        }

        double newPaidAmount =
                bill.getPaidAmount() + request.getAmountPaid();

        bill.setPaidAmount(newPaidAmount);

        // STATUS LOGIC
        if (newPaidAmount >= bill.getTotalAmount()) {
            bill.setStatus("FULL");
        } else if (newPaidAmount > 0) {
            bill.setStatus("PARTIAL");
        } else {
            bill.setStatus("PENDING");
        }

        Bill saved = billRepository.save(bill);

        return convertToResponse(saved);
    }

    public List<BillResponse> getPendingBills() {

        return billRepository
                .findByShopIdAndStatus(
                        securityUtils.getCurrentShopId(),
                        "PENDING")
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<BillResponse> getBillsByCustomer(
            Long customerId) {

        Long shopId = securityUtils.getCurrentShopId();

        List<Bill> bills =
                billRepository.findByShopIdAndCustomerId(
                        shopId,
                        customerId);

        return bills.stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<BillResponse> searchBillsByCustomerName(
            String customerName) {

        Long shopId = securityUtils.getCurrentShopId();

        List<Bill> bills =
                billRepository
                        .findByShopIdAndCustomer_NameContainingIgnoreCase(
                                shopId,
                                customerName);

        return bills.stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<BillResponse> getBillsByStatus(String status) {

        Long shopId = securityUtils.getCurrentShopId();

        List<Bill> bills =
                billRepository.findByShopIdAndStatus(
                        shopId,
                        status);

        return bills.stream()
                .map(this::convertToResponse)
                .toList();
    }
    private String generateInvoiceCode(Shop shop,
                                       Long invoiceNumber) {

        String year = String.valueOf(
                LocalDate.now().getYear());

        String formattedNumber =
                String.format("%04d", invoiceNumber);

        return shop.getInvoicePrefix()
                + "-" + year
                + "-" + formattedNumber;
    }

    public List<BillResponse> getPendingBillsForReminder() {

        Long shopId = securityUtils.getCurrentShopId();

        List<Bill> bills =
                billRepository.findByShopIdAndStatusIn(
                        shopId,
                        List.of("PENDING", "PARTIAL"));

        return bills.stream()
                .map(this::convertToResponse)
                .toList();
    }

    public String generateReminderMessage(Long billId) {

        Bill bill = billRepository
                .findByIdAndShopId(
                        billId,
                        securityUtils.getCurrentShopId())
                .orElseThrow();

        double remaining =
                bill.getTotalAmount()
                        - bill.getPaidAmount();

        if (remaining <= 0) {
            throw new RuntimeException("Bill already paid");
        }

        return "Dear "
                + bill.getCustomer().getName()
                + ", your pending amount of ₹"
                + remaining
                + " for Invoice "
                + generateInvoiceCode(
                bill.getShop(),
                bill.getInvoiceNumber())
                + " is due. Kindly make payment. Thank you!";
    }

    public String generateWhatsappLink(Long billId) {

        Bill bill = billRepository
                .findByIdAndShopId(
                        billId,
                        securityUtils.getCurrentShopId())
                .orElseThrow();

        String message = generateReminderMessage(billId);

        String mobile =
                "91" + bill.getCustomer().getMobile();

        String encodedMessage =
                URLEncoder.encode(message, StandardCharsets.UTF_8);

        return "https://wa.me/" +
                mobile +
                "?text=" +
                encodedMessage;
    }
    public CustomerLedgerResponse getCustomerLedger(Long customerId) {

        Long shopId = securityUtils.getCurrentShopId();

        List<Bill> bills =
                billRepository
                        .findByCustomerIdAndShopIdOrderByCreatedAtAsc(
                                customerId,
                                shopId);

        if (bills.isEmpty()) {
            throw new RuntimeException("No transactions found");
        }

        List<CustomerLedgerResponse.Entry> entries =
                new ArrayList<>();

        double balance = 0;

        for (Bill bill : bills) {

            String invoiceCode =
                    generateInvoiceCode(
                            bill.getShop(),
                            bill.getInvoiceNumber());

            // BILL ENTRY
            entries.add(
                    CustomerLedgerResponse.Entry.builder()
                            .date(bill.getCreatedAt())
                            .type("BILL")
                            .amount(bill.getTotalAmount())
                            .invoiceCode(invoiceCode)
                            .build()
            );

            balance += bill.getTotalAmount();

            // PAYMENT ENTRY (if any)
            if (bill.getPaidAmount() > 0) {

                entries.add(
                        CustomerLedgerResponse.Entry.builder()
                                .date(bill.getCreatedAt())
                                .type("PAYMENT")
                                .amount(bill.getPaidAmount())
                                .invoiceCode(invoiceCode)
                                .build()
                );

                balance -= bill.getPaidAmount();
            }
        }

        return CustomerLedgerResponse.builder()
                .customerName(bills.get(0)
                        .getCustomer()
                        .getName())
                .balance(balance)
                .entries(entries)
                .build();
    }
}
