package com.templeregistry.event.board;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority removes a board member.
 * Notifies the District Collector.
 */
@Getter
public class BoardMemberRemovedEvent extends BaseNotificationEvent {

    private final String trustName;
    private final String memberName;
    private final Long districtCollectorId;

    public BoardMemberRemovedEvent(
            Object source,
            Long boardMemberId,
            String trustName,
            String memberName,
            Long removedByUserId,
            Long districtCollectorId) {
        super(source, boardMemberId, "BOARD_MEMBER", removedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.SYSTEM);
        this.trustName = trustName;
        this.memberName = memberName;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "Board Member Removed";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Board member '%s' has been removed from %s", 
                memberName, trustName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/trusts";
    }
}
