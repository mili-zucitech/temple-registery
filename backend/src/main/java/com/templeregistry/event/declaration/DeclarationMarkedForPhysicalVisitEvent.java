package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

import java.time.LocalDate;

/**
 * Event fired when a District Collector marks a declaration for physical site visit.
 * Notifies the Temple Authority.
 */
@Getter
public class DeclarationMarkedForPhysicalVisitEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String markedByName;
    private final LocalDate scheduledDate;
    private final Integer financialYear;

    public DeclarationMarkedForPhysicalVisitEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long markedByUserId,
            String markedByName,
            Long templeAuthorityId,
            LocalDate scheduledDate,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", markedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.SITE_VISIT);
        this.templeName = templeName;
        this.templeAuthorityId = templeAuthorityId;
        this.markedByName = markedByName;
        this.scheduledDate = scheduledDate;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Physical Site Visit Scheduled";
    }

    @Override
    public String getNotificationBody() {
        String dateInfo = scheduledDate != null 
                ? " scheduled for " + scheduledDate 
                : "";
        return String.format("A physical site visit has been marked for %s (FY %d) by %s%s", 
                templeName, financialYear, markedByName, dateInfo);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId();
    }
}
