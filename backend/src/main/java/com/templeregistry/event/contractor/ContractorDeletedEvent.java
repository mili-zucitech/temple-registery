package com.templeregistry.event.contractor;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority removes a contractor.
 * Notifies the District Collector.
 */
@Getter
public class ContractorDeletedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String contractorName;
    private final String serviceType;
    private final Long districtCollectorId;

    public ContractorDeletedEvent(
            Object source,
            Long contractorId,
            String templeName,
            String contractorName,
            String serviceType,
            Long deletedByUserId,
            Long districtCollectorId) {
        super(source, contractorId, "CONTRACTOR", deletedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.LOW, NotificationCategory.SYSTEM);
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
        return "Contractor Removed";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Contractor '%s' (%s) has been removed from %s", 
                contractorName, serviceType, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/contractors";
    }
}
