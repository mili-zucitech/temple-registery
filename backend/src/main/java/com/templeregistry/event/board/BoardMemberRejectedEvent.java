package com.templeregistry.event.board;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector rejects a board member.
 * Notifies the Temple Authority.
 */
@Getter
public class BoardMemberRejectedEvent extends BaseNotificationEvent {

    private final String trustName;
    private final String memberName;
    private final String reason;
    private final Long templeAuthorityId;

    public BoardMemberRejectedEvent(
            Object source,
            Long boardMemberId,
            String trustName,
            String memberName,
            String reason,
            Long rejectedByUserId,
            Long templeAuthorityId) {
        super(source, boardMemberId, "BOARD_MEMBER", rejectedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.REJECTION);
        this.trustName = trustName;
        this.memberName = memberName;
        this.reason = reason;
        this.templeAuthorityId = templeAuthorityId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Board Member Rejected";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Board member '%s' in %s has been rejected. Reason: %s", 
                memberName, trustName, reason);
    }

    @Override
    public String getActionUrl() {
        return "/ta/board-members/" + getEntityId();
    }
}
