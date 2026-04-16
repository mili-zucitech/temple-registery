package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
    List<BoardMember> findAllByTrustIdAndIsCurrent(Long trustId, boolean isCurrent);
    List<BoardMember> findAllByTrustId(Long trustId);
}
