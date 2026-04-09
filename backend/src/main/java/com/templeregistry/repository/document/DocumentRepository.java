package com.templeregistry.repository.document;

import com.templeregistry.entity.document.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    Page<Document> findAllByOwnerTypeAndOwnerId(String ownerType, Long ownerId, Pageable pageable);

    List<Document> findAllByReferenceId(Long referenceId);
}
