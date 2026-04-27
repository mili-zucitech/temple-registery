package com.templeregistry.event.contractor;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates contractor information.
 * Notifies the District Collector.
 */
@Getter
public class ContractorUpdatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String contractorName;
    private final String serviceType;
    private final Long districtCollectorId;

    public ContractorUpdatedEvent(
            Object source,
            Long contractorId,
            String templeName,
            String contractorName,
            String serviceType,
            Long updatedByUserId,
            Long districtCollectorId) {
        super(source, contractorId, "CONTRACTOR", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
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
        return "Contractor Information Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Contractor information updated for '%s' (%s) at %s", 
                contractorName, serviceType, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/contractors/" + getEntityId();
    }
}
