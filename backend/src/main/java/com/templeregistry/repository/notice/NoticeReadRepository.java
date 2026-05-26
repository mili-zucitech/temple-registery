package com.templeregistry.repository.notice;

import com.templeregistry.entity.notice.NoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.Set;

public interface NoticeReadRepository extends JpaRepository<NoticeRead, Long> {

    Optional<NoticeRead> findByNoticeIdAndUserId(Long noticeId, Long userId);

    /** Returns the set of notice IDs that have been read by a given user. */
    @Query("SELECT nr.noticeId FROM NoticeRead nr WHERE nr.userId = :userId AND nr.noticeId IN :noticeIds")
    Set<Long> findReadNoticeIds(@Param("userId") Long userId, @Param("noticeIds") Iterable<Long> noticeIds);
}
