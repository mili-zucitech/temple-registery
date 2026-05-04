package com.templeregistry.event.finance;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

@Getter
public class FinanceApprovedEvent extends BaseNotificationEvent {
    private final String trustName;
    private final String financialYear;
    private final Long templeAuthorityId;

    public FinanceApprovedEvent(Object source, Long trustId, String trustName,
            String financialYear, Long dcUserId, Long templeAuthorityId) {
        super(source, trustId, "FINANCE", dcUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.APPROVAL);
        this.trustName = trustName;
        this.financialYear = financialYear;
        this.templeAuthorityId = templeAuthorityId;
    }

    @Override public Long[] getRecipientIds() { return new Long[]{templeAuthorityId}; }
    @Override public String getNotificationTitle() { return "Financial Statement Approved"; }
    @Override public String getNotificationBody() {
        return String.format("Financial statement for %s (FY %s) has been approved.", trustName, financialYear);
    }
    @Override public String getActionUrl() { return "/trusts/" + getEntityId() + "/financials"; }
}
