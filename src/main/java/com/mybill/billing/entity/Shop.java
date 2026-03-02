package com.mybill.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String ownerName;

    private String mobile;

    private String subscriptionStatus;

    private LocalDateTime createdAt;

    private String address;
    private String gstNumber;
    private String logoPath;
    @Builder.Default
    @Column(nullable = false)
    private Long nextInvoiceNumber = 1L;

    private String invoicePrefix;
}
