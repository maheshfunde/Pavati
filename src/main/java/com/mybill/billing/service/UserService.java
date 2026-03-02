package com.mybill.billing.service;

import com.mybill.billing.dto.StaffRequest;
import com.mybill.billing.dto.StaffResponse;
import com.mybill.billing.entity.Role;
import com.mybill.billing.entity.User;
import com.mybill.billing.repository.UserRepository;
import com.mybill.billing.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final SecurityUtils securityUtils;

    public User createUser(User user) {

        user.setPassword(
                encoder.encode(user.getPassword())
        );

        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<StaffResponse> getStaffForCurrentShop() {

        Long shopId = securityUtils.getCurrentShopId();

        return userRepository.findByShopIdAndRole(shopId, Role.STAFF)
                .stream()
                .map(this::toStaffResponse)
                .toList();
    }

    public StaffResponse updateStaffForCurrentShop(Long staffId, StaffRequest request) {

        Long shopId = securityUtils.getCurrentShopId();

        User staff = userRepository
                .findByIdAndShopIdAndRole(staffId, shopId, Role.STAFF)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        staff.setUsername(request.getUsername());
        staff.setPassword(encoder.encode(request.getPassword()));

        return toStaffResponse(userRepository.save(staff));
    }

    public void deleteStaffForCurrentShop(Long staffId) {

        Long shopId = securityUtils.getCurrentShopId();

        User staff = userRepository
                .findByIdAndShopIdAndRole(staffId, shopId, Role.STAFF)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        userRepository.delete(staff);
    }

    private StaffResponse toStaffResponse(User user) {
        return StaffResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .build();
    }
}
