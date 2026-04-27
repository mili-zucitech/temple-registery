package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority submits an asset declaration.
 * Notifies the District Collector.
 */
@Getter
public class DeclarationSubmittedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long districtCollectorId;
    private final Integer financialYear;

    public DeclarationSubmittedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long submittedByUserId,
            Long districtCollectorId,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", submittedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.HIGH, NotificationCategory.SUBMISSION);
        this.templeName = templeName;
        this.districtCollectorId = districtCollectorId;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "New Declaration Submitted";
    }

    @Override
    public String getNotificationBody() {
        return String.format("%s has submitted an asset declaration for FY %d. Review required.",
                templeName, financialYear);
    }

    @Override
    public String getActionUrl() {
        return "/dc/declarations/" + getEntityId();
    }
}
