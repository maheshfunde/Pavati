package com.mybill.billing.service;

import com.mybill.billing.dto.CustomerRequest;
import com.mybill.billing.dto.CustomerResponse;
import com.mybill.billing.entity.Customer;
import com.mybill.billing.entity.User;
import com.mybill.billing.repository.CustomerRepository;
import com.mybill.billing.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SecurityUtils securityUtils;

    public CustomerResponse createCustomer(CustomerRequest request) {

        User currentUser = securityUtils.getCurrentUser();

        Customer customer = new Customer();
        customer.setName(request.getName());
        customer.setMobile(request.getMobile());
        customer.setAddress(request.getAddress());

        customer.setShop(currentUser.getShop());

        customer = customerRepository.save(customer);

        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .mobile(customer.getMobile())
                .address(customer.getAddress())
                .build();
    }

    public List<CustomerResponse> getCustomers() {

        User currentUser = securityUtils.getCurrentUser();

        return customerRepository
                .findByShopId(currentUser.getShop().getId())
                .stream()
                .map(this::convertToResponse)
                .toList();    }
    private CustomerResponse convertToResponse(Customer customer) {

        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .mobile(customer.getMobile())
                .address(customer.getAddress())
                .build();
    }
}