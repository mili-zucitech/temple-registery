package com.templeregistry.repository.notice;

import com.templeregistry.entity.notice.Notice;
import com.templeregistry.entity.notice.NoticePriority;
import com.templeregistry.entity.notice.NoticeScope;
import com.templeregistry.entity.notice.NoticeStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class NoticeSpecification {

    private NoticeSpecification() {}

    public static Specification<Notice> forDistrictManager(Long districtId,
                                                            NoticeStatus status,
                                                            NoticePriority priority,
                                                            String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Show: notices for this DC's district OR global notices visible to all districts.
            // Guard against null districtId (misconfigured DC account) — fall back to global-only.
            if (districtId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("districtId"), districtId),
                        cb.equal(root.get("scope"), NoticeScope.GLOBAL)
                ));
            } else {
                predicates.add(cb.equal(root.get("scope"), NoticeScope.GLOBAL));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + search.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Notice> forAdmin(Long districtId,
                                                  NoticeScope scope,
                                                  NoticeStatus status,
                                                  NoticePriority priority,
                                                  String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (districtId != null) {
                predicates.add(cb.equal(root.get("districtId"), districtId));
            }
            if (scope != null) {
                predicates.add(cb.equal(root.get("scope"), scope));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + search.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
