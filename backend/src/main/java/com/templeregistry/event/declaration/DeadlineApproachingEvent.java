package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

import java.time.LocalDate;

/**
 * Event fired when a declaration deadline is approaching.
 * Priority escalates based on days remaining (7 days = MEDIUM, 3 days = HIGH, 1 day = CRITICAL).
 */
@Getter
public class DeadlineApproachingEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityUserId;
    private final LocalDate dueDate;
    private final int daysRemaining;
    private final Integer financialYear;

    public DeadlineApproachingEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long templeAuthorityUserId,
            LocalDate dueDate,
            int daysRemaining,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", null, null,
                determinePriority(daysRemaining), NotificationCategory.REMINDER);
        this.templeName = templeName;
        this.templeAuthorityUserId = templeAuthorityUserId;
        this.dueDate = dueDate;
        this.daysRemaining = daysRemaining;
        this.financialYear = financialYear;
    }

    private static NotificationPriority determinePriority(int daysRemaining) {
        if (daysRemaining <= 1) return NotificationPriority.CRITICAL;
        if (daysRemaining <= 3) return NotificationPriority.HIGH;
        return NotificationPriority.MEDIUM;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityUserId};
    }

    @Override
    public String getNotificationTitle() {
        return "Declaration Deadline Approaching";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Your declaration for FY %d is due in %d day(s) on %s. Please submit before the deadline.",
                financialYear, daysRemaining, dueDate);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId();
    }
}
