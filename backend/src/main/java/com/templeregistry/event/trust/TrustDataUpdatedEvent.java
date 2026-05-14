package com.templeregistry.event.trust;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates trust/board data.
 * Notifies the District Collector.
 */
@Getter
public class TrustDataUpdatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String trustName;
    private final Long districtCollectorId;

    public TrustDataUpdatedEvent(
            Object source,
            Long trustId,
            String templeName,
            String trustName,
            Long updatedByUserId,
            Long districtCollectorId) {
        super(source, trustId, "TRUST", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.SUBMISSION);
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
        return "Trust Data Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Trust data has been updated for %s: %s", templeName, trustName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/trusts/" + getEntityId();
    }
}
