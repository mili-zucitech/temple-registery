package com.templeregistry.event.trust;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority submits trust/board data.
 * Notifies the District Collector.
 */
@Getter
public class TrustDataSubmittedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String trustName;
    private final Long districtCollectorId;

    public TrustDataSubmittedEvent(
            Object source,
            Long trustId,
            String templeName,
            String trustName,
            Long submittedByUserId,
            Long districtCollectorId) {
        super(source, trustId, "TRUST", submittedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.HIGH, NotificationCategory.SUBMISSION);
        this.templeName = templeName;
        this.trustName = trustName;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "Trust Data Submitted";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Trust data has been submitted for %s: %s", templeName, trustName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/trusts/" + getEntityId();
    }
}
