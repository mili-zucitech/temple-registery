package com.templeregistry.event.trust;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector flags trust/board data for clarification.
 * Notifies the Temple Authority.
 */
@Getter
public class TrustDataFlaggedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String trustName;
    private final Long templeAuthorityId;
    private final String flaggedByName;
    private final String clarificationMessage;

    public TrustDataFlaggedEvent(
            Object source,
            Long trustId,
            String templeName,
            String trustName,
            Long flaggedByUserId,
            String flaggedByName,
            Long templeAuthorityId,
            String clarificationMessage) {
        super(source, trustId, "TRUST", flaggedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.CLARIFICATION);
        this.templeName = templeName;
        this.trustName = trustName;
        this.templeAuthorityId = templeAuthorityId;
        this.flaggedByName = flaggedByName;
        this.clarificationMessage = clarificationMessage;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Clarification Required - Trust Data";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Clarification required for trust '%s' (%s) by %s: %s", 
                trustName, templeName, flaggedByName, clarificationMessage);
    }

    @Override
    public String getActionUrl() {
        return "/ta/trusts/" + getEntityId();
    }
}
