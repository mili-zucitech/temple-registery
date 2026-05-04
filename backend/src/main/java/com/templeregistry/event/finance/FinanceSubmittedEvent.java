package com.templeregistry.event.finance;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

@Getter
public class FinanceSubmittedEvent extends BaseNotificationEvent {
    private final String trustName;
    private final String financialYear;
    private final Long districtCollectorId;

    public FinanceSubmittedEvent(Object source, Long trustId, String trustName,
            String financialYear, Long submittedByUserId, Long districtCollectorId) {
        super(source, trustId, "FINANCE", submittedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.SUBMISSION);
        this.trustName = trustName;
        this.financialYear = financialYear;
        this.districtCollectorId = districtCollectorId;
    }

    @Override public Long[] getRecipientIds() { return new Long[]{districtCollectorId}; }
    @Override public String getNotificationTitle() { return "Financial Statement Submitted"; }
    @Override public String getNotificationBody() {
        return String.format("Financial statement for %s (FY %s) has been submitted.", trustName, financialYear);
    }
    @Override public String getActionUrl() { return "/dc/trusts/" + getEntityId() + "/financials"; }
}
