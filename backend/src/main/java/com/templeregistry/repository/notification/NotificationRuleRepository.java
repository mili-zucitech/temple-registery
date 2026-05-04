package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.NotificationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRuleRepository extends JpaRepository<NotificationRule, Long> {

    /**
     * Find all matching enabled rules for a given event/entity/action combination.
     * Matches exact entity_type OR wildcard '*'.
     */
    @Query("""
        SELECT nr FROM NotificationRule nr
        WHERE nr.enabled = true
          AND nr.eventType = :eventType
          AND (nr.entityType = :entityType OR nr.entityType = '*')
          AND (nr.action = :action OR nr.action = '*')
          AND nr.deleted = false
        """)
    List<NotificationRule> findMatchingRules(
        @Param("eventType") String eventType,
        @Param("entityType") String entityType,
        @Param("action") String action
    );

    List<NotificationRule> findByEnabledTrueAndDeletedFalse();
}
