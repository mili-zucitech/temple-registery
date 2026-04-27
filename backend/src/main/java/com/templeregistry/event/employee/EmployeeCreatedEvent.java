package com.templeregistry.event.employee;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority adds a new employee.
 * Notifies the District Collector.
 */
@Getter
public class EmployeeCreatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String employeeName;
    private final String designation;
    private final Long districtCollectorId;

    public EmployeeCreatedEvent(
            Object source,
            Long employeeId,
            String templeName,
            String employeeName,
            String designation,
            Long createdByUserId,
            Long districtCollectorId) {
        super(source, employeeId, "EMPLOYEE", createdByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.LOW, NotificationCategory.SUBMISSION);
        this.templeName = templeName;
        this.employeeName = employeeName;
        this.designation = designation;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "New Employee Added";
    }

    @Override
    public String getNotificationBody() {
        return String.format("New employee '%s' (%s) has been added to %s", 
                employeeName, designation, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/employees/" + getEntityId();
    }
}
