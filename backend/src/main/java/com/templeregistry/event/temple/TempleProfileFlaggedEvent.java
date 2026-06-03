package com.templeregistry.event.temple;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector flags a temple profile for clarification.
 * Notifies the Temple Authority.
 */
@Getter
public class TempleProfileFlaggedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String flaggedByName;
    private final String clarificationMessage;

    public TempleProfileFlaggedEvent(
            Object source,
            Long templeId,
            String templeName,
            Long flaggedByUserId,
            String flaggedByName,
            Long templeAuthorityId,
            String clarificationMessage) {
        super(source, templeId, "TEMPLE", flaggedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.CLARIFICATION);
        this.templeName = templeName;
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
        return "Clarification Required - Temple Profile";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Clarification required for temple '%s' by %s: %s", 
                templeName, flaggedByName, clarificationMessage);
    }

    @Override
    public String getActionUrl() {
        return "/ta/temples/" + getEntityId();
    }
}
