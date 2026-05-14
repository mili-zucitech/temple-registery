package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector rejects an asset declaration.
 * Notifies the Temple Authority.
 */
@Getter
public class DeclarationRejectedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String rejectedByName;
    private final String rejectionReason;
    private final Integer financialYear;

    public DeclarationRejectedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long rejectedByUserId,
            String rejectedByName,
            Long templeAuthorityId,
            String rejectionReason,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", rejectedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.CRITICAL, NotificationCategory.REJECTION);
        this.templeName = templeName;
        this.templeAuthorityId = templeAuthorityId;
        this.rejectedByName = rejectedByName;
        this.rejectionReason = rejectionReason;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Declaration Rejected";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Your asset declaration for %s (FY %d) has been rejected by %s. Reason: %s", 
                templeName, financialYear, rejectedByName, rejectionReason);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId();
    }
}
