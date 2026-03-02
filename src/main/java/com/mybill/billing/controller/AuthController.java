package com.mybill.billing.controller;

import com.mybill.billing.dto.*;
import com.mybill.billing.entity.Role;
import com.mybill.billing.entity.Shop;
import com.mybill.billing.entity.User;
import com.mybill.billing.repository.ShopRepository;
import com.mybill.billing.repository.UserRepository;
import com.mybill.billing.security.JwtService;
import com.mybill.billing.security.SecurityUtils;
import com.mybill.billing.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/auth", "/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    // ===============================
    // LOGIN
    // ===============================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = userService.findByUsername(request.getUsername());

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }

        // Generate token using UserDetails style
        UserDetails userDetails =
                org.springframework.security.core.userdetails.User
                        .builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .authorities(user.getRole().name())
                        .build();

        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new LoginResponse(token));
    }

    // ===============================
    // REGISTER OWNER
    // ===============================
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        String prefix =
                request.getShopName()
                        .substring(0, 2)
                        .toUpperCase();

        Shop shop = Shop.builder()
                .name(request.getShopName())
                .ownerName(request.getOwnerName())
                .mobile(request.getMobile())
                .invoicePrefix(prefix)
                .subscriptionStatus("TRIAL")
                .createdAt(LocalDateTime.now())
                .nextInvoiceNumber(1L)
                .build();

        shop = shopRepository.save(shop);

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(
                        request.getPassword()))
                .role(Role.OWNER)
                .shop(shop)
                .build();

        userRepository.save(user);

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User
                        .builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .authorities(user.getRole().name())
                        .build();

        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new LoginResponse(token));
    }

    // ===============================
    // CREATE STAFF
    // ===============================
    @PreAuthorize("hasAuthority('OWNER')")
    @PostMapping("/create-staff")
    public String createStaff(
            @RequestBody StaffRequest request) {

        User user = securityUtils.getCurrentUser();

        Shop shop = user.getShop();

        User staff = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(
                        request.getPassword()))
                .shop(shop)
                .role(Role.STAFF)
                .build();

        userRepository.save(staff);

        return "Staff created successfully";
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public CurrentUserResponse currentUser() {

        User user = securityUtils.getCurrentUser();

        return CurrentUserResponse.builder()
                .username(user.getUsername())
                .role(user.getRole().name())
                .shopName(user.getShop().getName())
                .build();
    }

    @PreAuthorize("hasAuthority('OWNER')")
    @GetMapping("/staff")
    public List<StaffResponse> getStaff() {
        return userService.getStaffForCurrentShop();
    }

    @PreAuthorize("hasAuthority('OWNER')")
    @PutMapping("/staff/{id}")
    public StaffResponse updateStaff(
            @PathVariable Long id,
            @RequestBody StaffRequest request) {

        return userService.updateStaffForCurrentShop(id, request);
    }

    @PreAuthorize("hasAuthority('OWNER')")
    @DeleteMapping("/staff/{id}")
    public void deleteStaff(@PathVariable Long id) {
        userService.deleteStaffForCurrentShop(id);
    }
}
