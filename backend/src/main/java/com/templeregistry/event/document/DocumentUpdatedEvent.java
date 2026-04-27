package com.templeregistry.event.document;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority updates/replaces a document.
 * Notifies the District Collector.
 */
@Getter
public class DocumentUpdatedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String documentType;
    private final String documentName;
    private final Long districtCollectorId;

    public DocumentUpdatedEvent(
            Object source,
            Long documentId,
            String templeName,
            String documentType,
            String documentName,
            Long updatedByUserId,
            Long districtCollectorId) {
        super(source, documentId, "DOCUMENT", updatedByUserId, UserRole.TEMPLE_AUTHORITY,
                NotificationPriority.LOW, NotificationCategory.DOCUMENT);
        this.templeName = templeName;
        this.documentType = documentType;
        this.documentName = documentName;
        this.districtCollectorId = districtCollectorId;
    }

    @Override
    public Long[] getRecipientIds() {
        return new Long[]{districtCollectorId};
    }

    @Override
    public String getNotificationTitle() {
        return "Document Updated";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Document '%s' (%s) has been updated for %s", 
                documentName, documentType, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/documents/" + getEntityId();
    }
}
