package com.templeregistry.repository.accesscontrol;

import com.templeregistry.entity.accesscontrol.AccessControlPolicy;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccessControlPolicyRepository extends JpaRepository<AccessControlPolicy, Long> {

    Optional<AccessControlPolicy> findByTargetKeyAndSubjectTypeAndSubjectValue(
            String targetKey, SubjectType subjectType, String subjectValue);

    List<AccessControlPolicy> findAllByTargetKeyAndActiveTrue(String targetKey);

    List<AccessControlPolicy> findAllBySubjectTypeAndSubjectValueAndActiveTrue(
            SubjectType subjectType, String subjectValue);

    /** Batch: all active policies for a given set of target keys and a role. */
    @Query("SELECT p FROM AccessControlPolicy p " +
           "WHERE p.targetKey IN :targetKeys " +
           "  AND p.subjectType = :subjectType " +
           "  AND p.subjectValue = :subjectValue " +
           "  AND p.active = true")
    List<AccessControlPolicy> findAllByTargetKeysAndSubject(
            @Param("targetKeys") List<String> targetKeys,
            @Param("subjectType") SubjectType subjectType,
            @Param("subjectValue") String subjectValue);

    Page<AccessControlPolicy> findAll(Pageable pageable);
}
