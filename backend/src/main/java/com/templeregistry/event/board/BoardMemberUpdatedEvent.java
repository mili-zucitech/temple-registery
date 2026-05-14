package com.templeregistry.event.board;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates a board member.
 * Notifies the District Collector.
 */
@Getter
public class BoardMemberUpdatedEvent extends BaseNotificationEvent {

    private final String trustName;
    private final String memberName;
    private final Long districtCollectorId;

    public BoardMemberUpdatedEvent(
            Object source,
            Long boardMemberId,
            String trustName,
            String memberName,
            Long updatedByUserId,
            Long districtCollectorId) {
        super(source, boardMemberId, "BOARD_MEMBER", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.LOW, NotificationCategory.SUBMISSION);
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
        return "Board Member Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Board member '%s' in %s has been updated", 
                memberName, trustName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/board-members/" + getEntityId();
    }
}
