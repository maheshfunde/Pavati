package com.mybill.billing.repository;

import com.mybill.billing.entity.Role;
import com.mybill.billing.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    @Query("select u from User u left join fetch u.shop where u.username = :username")
    Optional<User> findByUsernameWithShop(@Param("username") String username);

    List<User> findByShopIdAndRole(Long shopId, Role role);

    Optional<User> findByIdAndShopIdAndRole(Long id, Long shopId, Role role);
}
