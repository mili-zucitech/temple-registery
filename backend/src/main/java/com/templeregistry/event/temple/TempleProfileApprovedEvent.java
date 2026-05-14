package com.templeregistry.event.temple;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector approves a temple profile.
 * Notifies the Temple Authority.
 */
@Getter
public class TempleProfileApprovedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String approvedByName;

    public TempleProfileApprovedEvent(
            Object source,
            Long templeId,
            String templeName,
            Long approvedByUserId,
            String approvedByName,
            Long templeAuthorityId) {
        super(source, templeId, "TEMPLE", approvedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.APPROVAL);
        this.templeName = templeName;
        this.templeAuthorityId = templeAuthorityId;
        this.approvedByName = approvedByName;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Temple Profile Approved";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Your temple profile '%s' has been approved by %s", 
                templeName, approvedByName);
    }

    @Override
    public String getActionUrl() {
        return "/ta/temples/" + getEntityId();
    }
}
