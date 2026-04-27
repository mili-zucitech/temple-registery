package com.templeregistry.event.board;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a District Collector approves a board member.
 * Notifies the Temple Authority.
 */
@Getter
public class BoardMemberApprovedEvent extends BaseNotificationEvent {

    private final String trustName;
    private final String memberName;
    private final Long templeAuthorityId;

    public BoardMemberApprovedEvent(
            Object source,
            Long boardMemberId,
            String trustName,
            String memberName,
            Long approvedByUserId,
            Long templeAuthorityId) {
        super(source, boardMemberId, "BOARD_MEMBER", approvedByUserId, UserRole.DISTRICT_COLLECTOR,
                NotificationPriority.HIGH, NotificationCategory.APPROVAL);
        this.trustName = trustName;
        this.memberName = memberName;
        this.templeAuthorityId = templeAuthorityId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{templeAuthorityId};
    }

    @Override
    public String getNotificationTitle() {
        return "Board Member Approved";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Board member '%s' in %s has been approved", 
                memberName, trustName);
    }

    @Override
    public String getActionUrl() {
        return "/ta/board-members/" + getEntityId();
    }
}
