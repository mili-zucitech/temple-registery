package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector flags a declaration for clarification.
 * Notifies the Temple Authority.
 */
@Getter
public class DeclarationFlaggedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String flaggedByName;
    private final String clarificationMessage;
    private final Integer financialYear;

    public DeclarationFlaggedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long flaggedByUserId,
            String flaggedByName,
            Long templeAuthorityId,
            String clarificationMessage,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", flaggedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.CLARIFICATION);
        this.templeName = templeName;
        this.templeAuthorityId = templeAuthorityId;
        this.flaggedByName = flaggedByName;
        this.clarificationMessage = clarificationMessage;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Clarification Required - Declaration";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Clarification required for declaration of %s (FY %d) by %s: %s", 
                templeName, financialYear, flaggedByName, clarificationMessage);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId();
    }
}
