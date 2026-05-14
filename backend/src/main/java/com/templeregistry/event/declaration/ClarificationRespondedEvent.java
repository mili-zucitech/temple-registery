package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority responds to a clarification request.
 * Notifies the District Collector.
 */
@Getter
public class ClarificationRespondedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long districtCollectorId;
    private final Integer financialYear;

    public ClarificationRespondedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long respondedByTaId,
            Long districtCollectorId,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", respondedByTaId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.CLARIFICATION);
        this.templeName = templeName;
        this.districtCollectorId = districtCollectorId;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "Clarification Response Received";
    }

    @Override
    public String getNotificationBody() {
        return String.format("%s has responded to your clarification request for FY %d declaration.",
                templeName, financialYear);
    }

    @Override
    public String getActionUrl() {
        return "/dc/declarations/" + getEntityId() + "/clarifications";
    }
}
