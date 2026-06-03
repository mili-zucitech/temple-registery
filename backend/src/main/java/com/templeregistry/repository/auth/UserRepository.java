package com.templeregistry.repository.auth;

import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findAllByRole(UserRole role);

    List<User> findAllByRoleAndDistrictId(UserRole role, Long districtId);

    Optional<User> findByTempleId(Long templeId);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByPasswordResetTokenHash(String tokenHash);

    long countByRole(UserRole role);

    /**
     * Full-text search across username, email and fullName.
     * Empty search string returns all users.
     */
    @Query("""
        SELECT u FROM User u
        WHERE (:search = '' OR
               LOWER(u.username)  LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.email)     LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY u.createdAt DESC
        """)
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    /** Same as {@link #searchUsers} but restricted to a specific role. */
    @Query("""
        SELECT u FROM User u
        WHERE u.role = :role
          AND (:search = '' OR
               LOWER(u.username)  LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.email)     LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.fullName)  LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY u.createdAt DESC
        """)
    Page<User> searchUsersByRole(@Param("role") UserRole role,
                                 @Param("search") String search,
                                 Pageable pageable);

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
