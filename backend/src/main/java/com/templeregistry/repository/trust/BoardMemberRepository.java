package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {

    List<BoardMember> findAllByTrustIdOrderByAppointmentDateDescIdDesc(Long trustId);

    /**
     * Finds a board member by trust and HMAC-SHA256 hash of their Aadhaar number.
     * Uses the deterministic hash column — NOT the AES-GCM encrypted column —
     * because AES-GCM with a random IV produces a different ciphertext for the same plaintext.
     */
    Optional<BoardMember> findByTrustIdAndAadhaarHash(Long trustId, String aadhaarHash);
}
