package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates an asset declaration.
 * Notifies the District Collector.
 */
@Getter
public class DeclarationUpdatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long districtCollectorId;
    private final Integer financialYear;

    public DeclarationUpdatedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long updatedByUserId,
            Long districtCollectorId,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
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
        return "Declaration Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("%s has updated their asset declaration for FY %d. Review required.",
                templeName, financialYear);
    }

    @Override
    public String getActionUrl() {
        return "/dc/declarations/" + getEntityId();
    }
}
