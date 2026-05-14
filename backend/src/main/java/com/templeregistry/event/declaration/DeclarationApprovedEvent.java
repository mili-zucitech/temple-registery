package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector approves an asset declaration.
 * Notifies the Temple Authority.
 */
@Getter
public class DeclarationApprovedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String approvedByName;
    private final Integer financialYear;

    public DeclarationApprovedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long approvedByUserId,
            String approvedByName,
            Long templeAuthorityId,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", approvedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.APPROVAL);
        this.templeName = templeName;
        this.templeAuthorityId = templeAuthorityId;
        this.approvedByName = approvedByName;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Declaration Approved";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Your asset declaration for %s (FY %d) has been approved by %s", 
                templeName, financialYear, approvedByName);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId();
    }
}
