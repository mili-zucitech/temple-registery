package com.templeregistry.event.board;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority adds a new board member.
 * Notifies the District Collector.
 */
@Getter
public class BoardMemberAddedEvent extends BaseNotificationEvent {

    private final String trustName;
    private final String memberName;
    private final String designation;
    private final Long districtCollectorId;

    public BoardMemberAddedEvent(
            Object source,
            Long boardMemberId,
            String trustName,
            String memberName,
            String designation,
            Long createdByUserId,
            Long districtCollectorId) {
        super(source, boardMemberId, "BOARD_MEMBER", createdByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.MEDIUM, NotificationCategory.SUBMISSION);
        this.trustName = trustName;
        this.memberName = memberName;
        this.designation = designation;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "New Board Member Added";
    }

    @Override
    public String getNotificationBody() {
        return String.format("New board member '%s' (%s) has been added to %s", 
                memberName, designation, trustName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/board-members/" + getEntityId();
    }
}
