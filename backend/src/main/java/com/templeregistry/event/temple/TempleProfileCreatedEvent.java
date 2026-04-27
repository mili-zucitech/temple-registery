package com.templeregistry.event.temple;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import com.templeregistry.service.notification.NotificationRecipientResolver;
import lombok.Getter;
import org.springframework.context.ApplicationContext;

/**
 * Event fired when a Temple Authority creates a new temple profile.
 * Notifies all District Collectors for the temple's district.
 */
@Getter
public class TempleProfileCreatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long districtId;

    public TempleProfileCreatedEvent(
            Object source,
            Long templeId,
            String templeName,
            Long createdByUserId,
            Long districtId) {
        super(source, templeId, "TEMPLE", createdByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.SUBMISSION);
        this.templeName = templeName;
        this.districtId = districtId;
    }

    @Override
    public Long[] getRecipientIds() {
        // Dynamically resolve all DCs for this district
        ApplicationContext context = (ApplicationContext) getSource();
        NotificationRecipientResolver resolver = context.getBean(NotificationRecipientResolver.class);
        return resolver.getDistrictCollectorIds(districtId);
    }

    @Override
    public String getNotificationTitle() {
        return "New Temple Profile Created";
    }

    @Override
    public String getNotificationBody() {
        return String.format("A new temple profile has been created: %s", templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/temples/" + getEntityId();
    }
}
