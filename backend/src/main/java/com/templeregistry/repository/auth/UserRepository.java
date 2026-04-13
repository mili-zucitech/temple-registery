package com.templeregistry.repository.auth;

import com.templeregistry.entity.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
            "UPDATE User u SET u.createdBy = :userId, u.updatedBy = :userId WHERE u.id = :userId")
    void updateSelfAuditFields(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
            "UPDATE User u SET u.templeId = :templeId, u.updatedBy = :userId WHERE u.id = :userId")
    void linkTemple(@org.springframework.data.repository.query.Param("userId") Long userId,
                    @org.springframework.data.repository.query.Param("templeId") Long templeId);
}
