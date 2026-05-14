package com.templeregistry.event.document;

import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.NotificationCategory;
import com.templeregistry.event.base.NotificationPriority;
import lombok.Getter;

/**
 * Event fired when a Temple Authority uploads a new document.
 * Notifies the District Collector.
 */
@Getter
public class DocumentUploadedEvent extends BaseNotificationEvent {

    private final String templeName;
    private final String documentType;
    private final String documentName;
    private final Long districtCollectorId;

    public DocumentUploadedEvent(
            Object source,
            Long documentId,
            String templeName,
            String documentType,
            String documentName,
            Long uploadedByUserId,
            Long districtCollectorId) {
        super(source, documentId, "DOCUMENT", uploadedByUserId, UserRole.TEMPLE_AUTHORITY,
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
        return "New Document Uploaded";
    }

    @Override
    public String getNotificationBody() {
        return String.format("New document '%s' (%s) has been uploaded for %s", 
                documentName, documentType, templeName);
    }

    @Override
    public String getActionUrl() {
        return "/dc/documents/" + getEntityId();
    }
}
