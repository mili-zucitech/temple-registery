package com.templeregistry.repository.document;

import com.templeregistry.entity.document.DocumentAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentAccessLogRepository extends JpaRepository<DocumentAccessLog, Long> {

    List<DocumentAccessLog> findAllByDocumentId(Long documentId);
}
