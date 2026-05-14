package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.BoardMeeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardMeetingRepository extends JpaRepository<BoardMeeting, Long> {

    Page<BoardMeeting> findAllByTrustIdOrderByMeetingDateDesc(Long trustId, Pageable pageable);

    List<BoardMeeting> findAllByTrustIdOrderByMeetingDateDesc(Long trustId);
}
