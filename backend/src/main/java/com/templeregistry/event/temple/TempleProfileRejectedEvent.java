package com.templeregistry.event.temple;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector rejects a temple profile.
 * Notifies the Temple Authority.
 */
@Getter
public class TempleProfileRejectedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityId;
    private final String rejectedByName;
    private final String rejectionReason;

    public TempleProfileRejectedEvent(
            Object source,
            Long templeId,
            String templeName,
            Long rejectedByUserId,
            String rejectedByName,
            Long templeAuthorityId,
            String rejectionReason) {
        super(source, templeId, "TEMPLE", rejectedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.CRITICAL, NotificationCategory.REJECTION);
        this.templeName = templeName;
        this.templeAuthorityId = templeAuthorityId;
        this.rejectedByName = rejectedByName;
        this.rejectionReason = rejectionReason;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Temple Profile Rejected";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Your temple profile '%s' has been rejected by %s. Reason: %s", 
                templeName, rejectedByName, rejectionReason);
    }

    @Override
    public String getActionUrl() {
        return "/ta/temples/" + getEntityId();
    }
}
