package com.templeregistry.event.trust;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector rejects trust/board data.
 * Notifies the Temple Authority.
 */
@Getter
public class TrustDataRejectedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String trustName;
    private final Long templeAuthorityId;
    private final String rejectedByName;
    private final String rejectionReason;

    public TrustDataRejectedEvent(
            Object source,
            Long trustId,
            String templeName,
            String trustName,
            Long rejectedByUserId,
            String rejectedByName,
            Long templeAuthorityId,
            String rejectionReason) {
        super(source, trustId, "TRUST", rejectedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.CRITICAL, NotificationCategory.REJECTION);
        this.templeName = templeName;
        this.trustName = trustName;
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
        return "Trust Data Rejected";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Trust data for '%s' (%s) has been rejected by %s. Reason: %s", 
                trustName, templeName, rejectedByName, rejectionReason);
    }

    @Override
    public String getActionUrl() {
        return "/ta/trusts/" + getEntityId();
    }
}
