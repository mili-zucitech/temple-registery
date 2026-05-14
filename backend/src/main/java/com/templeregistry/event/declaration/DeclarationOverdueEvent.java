package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

import java.time.LocalDate;

/**
 * Event fired when a declaration becomes overdue (past due date without approval).
 * Notifies both Temple Authority and District Collector.
 */
@Getter
public class DeclarationOverdueEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityUserId;
    private final Long districtCollectorId;
    private final LocalDate dueDate;
    private final Integer financialYear;

    public DeclarationOverdueEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long templeAuthorityUserId,
            Long districtCollectorId,
            LocalDate dueDate,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", null, null,
                NotificationPriority.CRITICAL, NotificationCategory.OVERDUE);
        this.templeName = templeName;
        this.templeAuthorityUserId = templeAuthorityUserId;
        this.districtCollectorId = districtCollectorId;
        this.dueDate = dueDate;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityUserId, districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "Declaration Overdue";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Declaration for %s (FY %d) is overdue. Due date was %s. Immediate action required.",
                templeName, financialYear, dueDate);
    }

    @Override
    public String getActionUrl() {
        return "/declarations/" + getEntityId();
    }
}
