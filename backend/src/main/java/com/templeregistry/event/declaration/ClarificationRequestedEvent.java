package com.templeregistry.event.declaration;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector requests clarification on a declaration.
 * Notifies the Temple Authority.
 */
@Getter
public class ClarificationRequestedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final Long templeAuthorityUserId;
    private final String clarificationMessage;
    private final Integer financialYear;

    public ClarificationRequestedEvent(
            Object source,
            Long declarationId,
            String templeName,
            Long requestedByDcId,
            Long templeAuthorityUserId,
            String clarificationMessage,
            Integer financialYear) {
        super(source, declarationId, "DECLARATION", requestedByDcId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.CLARIFICATION);
        this.templeName = templeName;
        this.templeAuthorityUserId = templeAuthorityUserId;
        this.clarificationMessage = clarificationMessage;
        this.financialYear = financialYear;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityUserId};
    }

    @Override
    public String getNotificationTitle() {
        return "Clarification Required";
    }

    @Override
    public String getNotificationBody() {
        return String.format("The District Collector has requested clarification on your declaration for FY %d: %s",
                financialYear, clarificationMessage);
    }

    @Override
    public String getActionUrl() {
        return "/ta/declarations/" + getEntityId() + "/clarifications";
    }
}
