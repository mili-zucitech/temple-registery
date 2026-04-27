package com.templeregistry.event.contractor;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority adds a new contractor.
 * Notifies the District Collector.
 */
@Getter
public class ContractorCreatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String contractorName;
    private final String serviceType;
    private final Long districtCollectorId;

    public ContractorCreatedEvent(
            Object source,
            Long contractorId,
            String templeName,
            String contractorName,
            String serviceType,
            Long createdByUserId,
            Long districtCollectorId) {
        super(source, contractorId, "CONTRACTOR", createdByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.LOW, NotificationCategory.SUBMISSION);
        this.templeName = templeName;
        this.contractorName = contractorName;
        this.serviceType = serviceType;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "New Contractor Added";
    }

    @Override
    public String getNotificationBody() {
        return String.format("New contractor '%s' (%s) has been added to %s", 
                contractorName, serviceType, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/contractors/" + getEntityId();
    }
}
