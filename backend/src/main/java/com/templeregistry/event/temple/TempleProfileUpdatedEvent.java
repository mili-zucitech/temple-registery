package com.templeregistry.event.temple;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates a temple profile.
 * Notifies the District Collector.
 */
@Getter
public class TempleProfileUpdatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long districtCollectorId;

    public TempleProfileUpdatedEvent(
            Object source,
            Long templeId,
            String templeName,
            Long updatedByUserId,
            Long districtCollectorId) {
        super(source, templeId, "TEMPLE", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.LOW, NotificationCategory.SUBMISSION);
        this.templeName = templeName;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "Temple Profile Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Temple profile has been updated: %s", templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/temples/" + getEntityId();
    }
}
