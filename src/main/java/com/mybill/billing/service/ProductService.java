package com.mybill.billing.service;

import com.mybill.billing.dto.ProductRequest;
import com.mybill.billing.dto.ProductResponse;
import com.mybill.billing.entity.Product;
import com.mybill.billing.entity.Shop;
import com.mybill.billing.repository.ProductRepository;
import com.mybill.billing.repository.ShopRepository;
import com.mybill.billing.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final SecurityUtils securityUtils;

    // CREATE PRODUCT
    public ProductResponse createProduct(ProductRequest request) {

        Long shopId = securityUtils.getCurrentShopId();

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow();

        Product product = Product.builder()
                .name(request.getName())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .shop(shop)
                .build();

        return convert(productRepository.save(product));
    }

    // LIST PRODUCTS
    public List<ProductResponse> getProducts() {

        return productRepository
                .findByShopId(securityUtils.getCurrentShopId())
                .stream()
                .map(this::convert)
                .toList();
    }

    // GET SINGLE PRODUCT
    public ProductResponse getProduct(Long id) {

        Product product = productRepository
                .findByIdAndShopId(
                        id,
                        securityUtils.getCurrentShopId())
                .orElseThrow();

        return convert(product);
    }

    // UPDATE PRODUCT
    public ProductResponse updateProduct(
            Long id,
            ProductRequest request) {

        Product product = productRepository
                .findByIdAndShopId(
                        id,
                        securityUtils.getCurrentShopId())
                .orElseThrow();

        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());

        return convert(productRepository.save(product));
    }

    // DELETE PRODUCT
    public void deleteProduct(Long id) {

        Product product = productRepository
                .findByIdAndShopId(
                        id,
                        securityUtils.getCurrentShopId())
                .orElseThrow();

        productRepository.delete(product);
    }

    // DTO CONVERTER
    private ProductResponse convert(Product product) {

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .build();
    }
}
