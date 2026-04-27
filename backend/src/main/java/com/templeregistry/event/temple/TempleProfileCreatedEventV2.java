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
 * Dynamically notifies all District Collectors for the temple's district.
 * 
 * Usage: new TempleProfileCreatedEventV2(applicationContext, templeId, createdByUserId)
 */
@Getter
public class TempleProfileCreatedEventV2 extends BaseNotificationEvent {

    private final Long templeId;

    public TempleProfileCreatedEventV2(
            ApplicationContext context,
            Long templeId,
            Long createdByUserId) {
        super(context, templeId, "TEMPLE", createdByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.SUBMISSION);
        this.templeId = templeId;
    }

    @Override
    public Long[] getRecipientIds() {
        ApplicationContext context = (ApplicationContext) getSource();
        NotificationRecipientResolver resolver = context.getBean(NotificationRecipientResolver.class);
        return resolver.getDistrictCollectorsForTemple(templeId);
    }

    @Override
    public String getNotificationTitle() {
        return "New Temple Profile Created";
    }

    @Override
    public String getNotificationBody() {
        ApplicationContext context = (ApplicationContext) getSource();
        NotificationRecipientResolver resolver = context.getBean(NotificationRecipientResolver.class);
        String templeName = resolver.getTempleName(templeId);
        return String.format("A new temple profile has been created: %s", templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/temples/" + getEntityId();
    }
}
