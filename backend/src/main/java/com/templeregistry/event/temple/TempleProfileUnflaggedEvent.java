package com.templeregistry.event.temple;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

@Getter
public class TempleProfileUnflaggedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String dcName;
    private final Long templeAuthorityId;

    public TempleProfileUnflaggedEvent(
            Object source,
            Long templeId,
            String templeName,
            Long dcUserId,
            String dcName,
            Long templeAuthorityId) {
        super(source, templeId, "TEMPLE_PROFILE", dcUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.MEDIUM, NotificationCategory.APPROVAL);
        this.templeName = templeName;
        this.dcName = dcName;
        this.templeAuthorityId = templeAuthorityId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Temple Profile Flag Removed";
    }

    @Override
    public String getNotificationBody() {
        return String.format("The flag on your temple profile '%s' has been removed by %s.",
                templeName, dcName);
    }

    @Override
    public String getActionUrl() {
        return "/temple/profile";
    }
}
