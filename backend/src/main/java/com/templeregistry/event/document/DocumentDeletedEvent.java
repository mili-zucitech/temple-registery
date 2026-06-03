package com.templeregistry.event.document;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority deletes a document.
 * Notifies the District Collector.
 */
@Getter
public class DocumentDeletedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String documentType;
    private final String documentName;
    private final Long districtCollectorId;

    public DocumentDeletedEvent(
            Object source,
            Long documentId,
            String templeName,
            String documentType,
            String documentName,
            Long deletedByUserId,
            Long districtCollectorId) {
        super(source, documentId, "DOCUMENT", deletedByUserId, UserRole.TEMPLE_AUTHORITY,
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
        return "Document Deleted";
    }

    @Override
    public String getNotificationBody() {
        return String.format("Document '%s' (%s) has been deleted from %s", 
                documentName, documentType, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/documents";
    }
}
