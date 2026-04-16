package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    List<BoardMember> findAllByTrustIdAndIsCurrent(Long trustId, boolean isCurrent);
    List<BoardMember> findAllByTrustId(Long trustId);
    List<BoardMember> findAllByTrustIdAndIsCurrentOrderByAppointmentDateDesc(Long trustId, boolean isCurrent);
    List<BoardMember> findAllByTrustIdOrderByAppointmentDateDesc(Long trustId);
    Page<BoardMember> findAllByTrustId(Long trustId, Pageable pageable);
}
