package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

import java.time.LocalDate;

/**
 * Event fired when a District Collector schedules a site visit for a declaration.
 * Notifies the Temple Authority.
 */
@Getter
public class SiteVisitScheduledEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityUserId;
    private final LocalDate scheduledDate;
    private final Integer financialYear;

    public SiteVisitScheduledEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long scheduledByDcId,
            Long templeAuthorityUserId,
            LocalDate scheduledDate,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", scheduledByDcId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.SITE_VISIT);
        this.templeName = templeName;
        this.templeAuthorityUserId = templeAuthorityUserId;
        this.scheduledDate = scheduledDate;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityUserId};
    }

    @Override
    public String getNotificationTitle() {
        return "Site Visit Scheduled";
    }

    @Override
    public String getNotificationBody() {
        return String.format("A site visit has been scheduled for your FY %d declaration on %s. Please ensure availability.",
                financialYear, scheduledDate);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId();
    }
}
