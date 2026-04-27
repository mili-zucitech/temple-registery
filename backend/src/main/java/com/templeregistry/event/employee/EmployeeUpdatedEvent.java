package com.templeregistry.event.employee;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates employee information.
 * Notifies the District Collector.
 */
@Getter
public class EmployeeUpdatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String employeeName;
    private final String designation;
    private final Long districtCollectorId;

    public EmployeeUpdatedEvent(
            Object source,
            Long employeeId,
            String templeName,
            String employeeName,
            String designation,
            Long updatedByUserId,
            Long districtCollectorId) {
        super(source, employeeId, "EMPLOYEE", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
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
        return "Employee Information Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Employee information updated for '%s' (%s) at %s", 
                employeeName, designation, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/employees/" + getEntityId();
    }
}
