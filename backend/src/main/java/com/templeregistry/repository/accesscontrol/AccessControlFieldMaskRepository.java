package com.templeregistry.repository.accesscontrol;

import com.templeregistry.entity.accesscontrol.AccessControlFieldMask;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccessControlFieldMaskRepository extends JpaRepository<AccessControlFieldMask, Long> {

    Optional<AccessControlFieldMask> findByFieldKeyAndSubjectTypeAndSubjectValue(
            String fieldKey, SubjectType subjectType, String subjectValue);

    List<AccessControlFieldMask> findAllByFieldKeyAndActiveTrue(String fieldKey);

    /** Batch: all active masks for a role or user across all field keys. */
    @Query("SELECT m FROM AccessControlFieldMask m " +
           "WHERE m.subjectType = :subjectType " +
           "  AND m.subjectValue = :subjectValue " +
           "  AND m.active = true " +
           "  AND m.maskEnabled = true")
    List<AccessControlFieldMask> findAllActiveMasksForSubject(
            @Param("subjectType") SubjectType subjectType,
            @Param("subjectValue") String subjectValue);

    Page<AccessControlFieldMask> findAll(Pageable pageable);
}
