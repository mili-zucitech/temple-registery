package com.templeregistry.repository.notice;

import com.templeregistry.entity.notice.NoticeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeAttachmentRepository extends JpaRepository<NoticeAttachment, Long> {

    List<NoticeAttachment> findAllByNoticeId(Long noticeId);
}
