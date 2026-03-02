package com.mybill.billing.security;

import com.mybill.billing.entity.User;
import com.mybill.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public User getCurrentUser() {

        String username = getCurrentUsername();
        return userRepository.findByUsernameWithShop(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"));
    }

    public Long getCurrentShopId() {

        User user = getCurrentUser();
        if (user.getShop() == null || user.getShop().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Shop not found for current user");
        }
        return user.getShop().getId();
    }

    private String getCurrentUsername() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Unauthenticated request");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserPrincipal customPrincipal) {
            return customPrincipal.getUsername();
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authentication");
    }
}
