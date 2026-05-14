package com.templeregistry.event.trust;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector approves trust/board data.
 * Notifies the Temple Authority.
 */
@Getter
public class TrustDataApprovedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String trustName;
    private final Long templeAuthorityId;
    private final String approvedByName;

    public TrustDataApprovedEvent(
            Object source,
            Long trustId,
            String templeName,
            String trustName,
            Long approvedByUserId,
            String approvedByName,
            Long templeAuthorityId) {
        super(source, trustId, "TRUST", approvedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.APPROVAL);
        this.templeName = templeName;
        this.trustName = trustName;
        this.templeAuthorityId = templeAuthorityId;
        this.approvedByName = approvedByName;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Trust Data Approved";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Trust data for '%s' (%s) has been approved by %s", 
                trustName, templeName, approvedByName);
    }

    @Override
    public String getActionUrl() {
        return "/ta/trusts/" + getEntityId();
    }
}
