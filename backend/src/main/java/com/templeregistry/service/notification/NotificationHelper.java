package com.templeregistry.service.notification;

import com.templeregistry.entity.temple.Temple;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.event.temple.*;
import com.templeregistry.event.trust.*;
import com.templeregistry.event.employee.*;
import com.templeregistry.event.contractor.*;
import com.templeregistry.event.declaration.*;
import com.templeregistry.event.document.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

/**
 * Helper service for publishing notifications with dynamic recipient resolution.
 * Simplifies notification integration - just call the appropriate method.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationHelper {

    private final ApplicationContext applicationContext;
    private final NotificationEventPublisher eventPublisher;
    private final NotificationRecipientResolver recipientResolver;
    private final TempleRepository templeRepository;

    // ==================== TEMPLE PROFILE NOTIFICATIONS ====================

    /**
     * Notify DCs when TA creates a temple profile.
     */
    public void notifyTempleCreated(Long templeId, Long createdByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new TempleProfileCreatedEvent(
            applicationContext,
            templeId,
            temple.getName(),
            createdByUserId,
            temple.getDistrictId()
        ));
        log.info("Published TempleProfileCreatedEvent for temple: {} to {} DC(s)", templeId, dcIds.length);
    }

    /**
     * Notify DCs when TA updates a temple profile.
     */
    public void notifyTempleUpdated(Long templeId, Long updatedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new TempleProfileUpdatedEvent(
            applicationContext,
            templeId,
            temple.getName(),
            updatedByUserId,
            temple.getDistrictId()
        ));
        log.info("Published TempleProfileUpdatedEvent for temple: {} to {} DC(s)", templeId, dcIds.length);
    }

    /**
     * Notify TAs when DC approves a temple profile.
     */
    public void notifyTempleApproved(Long templeId, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        eventPublisher.publish(new TempleProfileApprovedEvent(
            applicationContext,
            templeId,
            temple.getName(),
            dcUserId,
            dcName,
            taIds[0]  // Primary TA
        ));
        log.info("Published TempleProfileApprovedEvent for temple: {} to {} TA(s)", templeId, taIds.length);
    }

    /**
     * Notify TAs when DC rejects a temple profile.
     */
    public void notifyTempleRejected(Long templeId, Long dcUserId, String reason) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        eventPublisher.publish(new TempleProfileRejectedEvent(
            applicationContext,
            templeId,
            temple.getName(),
            dcUserId,
            dcName,
            taIds[0],  // Primary TA
            reason
        ));
        log.info("Published TempleProfileRejectedEvent for temple: {} to {} TA(s)", templeId, taIds.length);
    }

    /**
     * Notify TAs when DC flags a temple profile for clarification.
     */
    public void notifyTempleFlagged(Long templeId, Long dcUserId, String message) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        eventPublisher.publish(new TempleProfileFlaggedEvent(
            applicationContext,
            templeId,
            temple.getName(),
            dcUserId,
            dcName,
            taIds[0],  // Primary TA
            message
        ));
        log.info("Published TempleProfileFlaggedEvent for temple: {} to {} TA(s)", templeId, taIds.length);
    }

    // ==================== TRUST NOTIFICATIONS ====================

    /**
     * Notify DCs when TA submits trust data.
     */
    public void notifyTrustSubmitted(Long trustId, Long templeId, String trustName, Long submittedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        // Use first DC for now (events need refactoring for multiple recipients)
        eventPublisher.publish(new TrustDataSubmittedEvent(
            applicationContext,
            trustId,
            temple.getName(),
            trustName,
            submittedByUserId,
            dcIds[0]
        ));
        log.info("Published TrustDataSubmittedEvent for trust: {} to {} DC(s)", trustId, dcIds.length);
    }

    /**
     * Notify DCs when TA updates trust data.
     */
    public void notifyTrustUpdated(Long trustId, Long templeId, String trustName, Long updatedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new TrustDataUpdatedEvent(
            applicationContext,
            trustId,
            temple.getName(),
            trustName,
            updatedByUserId,
            dcIds[0]
        ));
        log.info("Published TrustDataUpdatedEvent for trust: {} to {} DC(s)", trustId, dcIds.length);
    }

    /**
     * Notify TAs when DC approves trust data.
     */
    public void notifyTrustApproved(Long trustId, Long templeId, String trustName, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        eventPublisher.publish(new TrustDataApprovedEvent(
            applicationContext,
            trustId,
            temple.getName(),
            trustName,
            dcUserId,
            dcName,
            taIds[0]
        ));
        log.info("Published TrustDataApprovedEvent for trust: {} to {} TA(s)", trustId, taIds.length);
    }

    /**
     * Notify TAs when DC rejects trust data.
     */
    public void notifyTrustRejected(Long trustId, Long templeId, String trustName, Long dcUserId, String reason) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        eventPublisher.publish(new TrustDataRejectedEvent(
            applicationContext,
            trustId,
            temple.getName(),
            trustName,
            dcUserId,
            dcName,
            taIds[0],
            reason
        ));
        log.info("Published TrustDataRejectedEvent for trust: {} to {} TA(s)", trustId, taIds.length);
    }

    /**
     * Notify TAs when DC flags trust data for clarification.
     */
    public void notifyTrustFlagged(Long trustId, Long templeId, String trustName, Long dcUserId, String message) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        eventPublisher.publish(new TrustDataFlaggedEvent(
            applicationContext,
            trustId,
            temple.getName(),
            trustName,
            dcUserId,
            dcName,
            taIds[0],
            message
        ));
        log.info("Published TrustDataFlaggedEvent for trust: {} to {} TA(s)", trustId, taIds.length);
    }

    // ==================== EMPLOYEE NOTIFICATIONS ====================

    /**
     * Notify DCs when TA creates an employee.
     */
    public void notifyEmployeeCreated(Long employeeId, Long templeId, String employeeName, String designation, Long createdByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new EmployeeCreatedEvent(
            applicationContext,
            employeeId,
            temple.getName(),
            employeeName,
            designation,
            createdByUserId,
            dcIds[0]
        ));
        log.info("Published EmployeeCreatedEvent for employee: {} to {} DC(s)", employeeId, dcIds.length);
    }

    /**
     * Notify DCs when TA updates an employee.
     */
    public void notifyEmployeeUpdated(Long employeeId, Long templeId, String employeeName, String designation, Long updatedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new EmployeeUpdatedEvent(
            applicationContext,
            employeeId,
            temple.getName(),
            employeeName,
            designation,
            updatedByUserId,
            dcIds[0]
        ));
        log.info("Published EmployeeUpdatedEvent for employee: {} to {} DC(s)", employeeId, dcIds.length);
    }

    /**
     * Notify DCs when TA deletes an employee.
     */
    public void notifyEmployeeDeleted(Long employeeId, Long templeId, String employeeName, String designation, Long deletedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new EmployeeDeletedEvent(
            applicationContext,
            employeeId,
            temple.getName(),
            employeeName,
            designation,
            deletedByUserId,
            dcIds[0]
        ));
        log.info("Published EmployeeDeletedEvent for employee: {} to {} DC(s)", employeeId, dcIds.length);
    }

    // ==================== CONTRACTOR NOTIFICATIONS ====================

    /**
     * Notify DCs when TA creates a contractor.
     */
    public void notifyContractorCreated(Long contractorId, Long templeId, String contractorName, String serviceType, Long createdByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new ContractorCreatedEvent(
            applicationContext,
            contractorId,
            temple.getName(),
            contractorName,
            serviceType,
            createdByUserId,
            dcIds[0]
        ));
        log.info("Published ContractorCreatedEvent for contractor: {} to {} DC(s)", contractorId, dcIds.length);
    }

    /**
     * Notify DCs when TA updates a contractor.
     */
    public void notifyContractorUpdated(Long contractorId, Long templeId, String contractorName, String serviceType, Long updatedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new ContractorUpdatedEvent(
            applicationContext,
            contractorId,
            temple.getName(),
            contractorName,
            serviceType,
            updatedByUserId,
            dcIds[0]
        ));
        log.info("Published ContractorUpdatedEvent for contractor: {} to {} DC(s)", contractorId, dcIds.length);
    }

    /**
     * Notify DCs when TA deletes a contractor.
     */
    public void notifyContractorDeleted(Long contractorId, Long templeId, String contractorName, String serviceType, Long deletedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new ContractorDeletedEvent(
            applicationContext,
            contractorId,
            temple.getName(),
            contractorName,
            serviceType,
            deletedByUserId,
            dcIds[0]
        ));
        log.info("Published ContractorDeletedEvent for contractor: {} to {} DC(s)", contractorId, dcIds.length);
    }

    // ==================== DECLARATION NOTIFICATIONS ====================

    /**
     * Notify DCs when TA submits a declaration.
     */
    public void notifyDeclarationSubmitted(Long declarationId, Long templeId, String financialYear, Long submittedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new DeclarationSubmittedEvent(
            applicationContext,
            declarationId,
            temple.getName(),
            submittedByUserId,
            dcIds[0],
            parseFinancialYear(financialYear)
        ));
        log.info("Published DeclarationSubmittedEvent for declaration: {} to {} DC(s)", declarationId, dcIds.length);
    }
    
    private Integer parseFinancialYear(String financialYear) {
        if (financialYear == null || financialYear.isBlank()) {
            return null;
        }
        // Extract first year from format "2024-25" -> 2024
        try {
            return Integer.parseInt(financialYear.split("-")[0]);
        } catch (Exception e) {
            log.warn("Failed to parse financial year: {}", financialYear);
            return null;
        }
    }

    /**
     * Notify DCs when TA updates a declaration.
     */
    public void notifyDeclarationUpdated(Long declarationId, Long templeId, String financialYear, Long updatedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new DeclarationUpdatedEvent(
            applicationContext,
            declarationId,
            temple.getName(),
            updatedByUserId,
            dcIds[0],
            parseFinancialYear(financialYear)
        ));
        log.info("Published DeclarationUpdatedEvent for declaration: {} to {} DC(s)", declarationId, dcIds.length);
    }

    /**
     * Notify TAs when DC approves a declaration.
     */
    public void notifyDeclarationApproved(Long declarationId, Long templeId, String financialYear, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        // Publish one event per TA to ensure all TAs receive notification
        for (Long taId : taIds) {
            eventPublisher.publish(new DeclarationApprovedEvent(
                applicationContext,
                declarationId,
                temple.getName(),
                dcUserId,
                dcName,
                taId,
                parseFinancialYear(financialYear)
            ));
        }
        log.info("Published DeclarationApprovedEvent for declaration: {} to {} TA(s)", declarationId, taIds.length);
    }

    /**
     * Notify TAs when DC rejects a declaration.
     */
    public void notifyDeclarationRejected(Long declarationId, Long templeId, String financialYear, Long dcUserId, String reason) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        // Publish one event per TA to ensure all TAs receive notification
        for (Long taId : taIds) {
            eventPublisher.publish(new DeclarationRejectedEvent(
                applicationContext,
                declarationId,
                temple.getName(),
                dcUserId,
                dcName,
                taId,
                reason,
                parseFinancialYear(financialYear)
            ));
        }
        log.info("Published DeclarationRejectedEvent for declaration: {} to {} TA(s)", declarationId, taIds.length);
    }

    /**
     * Notify TAs when DC flags a declaration for clarification.
     */
    public void notifyDeclarationFlagged(Long declarationId, Long templeId, String financialYear, Long dcUserId, String message) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        // Publish one event per TA to ensure all TAs receive notification
        for (Long taId : taIds) {
            eventPublisher.publish(new DeclarationFlaggedEvent(
                applicationContext,
                declarationId,
                temple.getName(),
                dcUserId,
                dcName,
                taId,
                message,
                parseFinancialYear(financialYear)
            ));
        }
        log.info("Published DeclarationFlaggedEvent for declaration: {} to {} TA(s)", declarationId, taIds.length);
    }

    /**
     * Notify TAs when DC marks a declaration for physical visit.
     */
    public void notifyDeclarationMarkedForPhysicalVisit(Long declarationId, Long templeId, String financialYear, Long dcUserId, java.time.LocalDate scheduledDate) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
        if (taIds.length == 0) {
            log.warn("No TAs found for temple: {}", templeId);
            return;
        }

        String dcName = recipientResolver.getUserFullName(dcUserId);

        // Publish one event per TA to ensure all TAs receive notification
        for (Long taId : taIds) {
            eventPublisher.publish(new DeclarationMarkedForPhysicalVisitEvent(
                applicationContext,
                declarationId,
                temple.getName(),
                dcUserId,
                dcName,
                taId,
                scheduledDate,
                parseFinancialYear(financialYear)
            ));
        }
        log.info("Published DeclarationMarkedForPhysicalVisitEvent for declaration: {} to {} TA(s)", declarationId, taIds.length);
    }

    // ==================== DOCUMENT NOTIFICATIONS ====================

    /**
     * Notify DCs when TA uploads a document.
     */
    public void notifyDocumentUploaded(Long documentId, Long templeId, String documentType, String documentName, Long uploadedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new DocumentUploadedEvent(
            applicationContext,
            documentId,
            temple.getName(),
            documentType,
            documentName,
            uploadedByUserId,
            dcIds[0]
        ));
        log.info("Published DocumentUploadedEvent for document: {} to {} DC(s)", documentId, dcIds.length);
    }

    /**
     * Notify DCs when TA updates a document.
     */
    public void notifyDocumentUpdated(Long documentId, Long templeId, String documentType, String documentName, Long updatedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new DocumentUpdatedEvent(
            applicationContext,
            documentId,
            temple.getName(),
            documentType,
            documentName,
            updatedByUserId,
            dcIds[0]
        ));
        log.info("Published DocumentUpdatedEvent for document: {} to {} DC(s)", documentId, dcIds.length);
    }

    /**
     * Notify DCs when TA deletes a document.
     */
    public void notifyDocumentDeleted(Long documentId, Long templeId, String documentType, String documentName, Long deletedByUserId) {
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Cannot send notification: Temple not found: {}", templeId);
            return;
        }

        Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
        if (dcIds.length == 0) {
            log.warn("No DCs found for district: {}", temple.getDistrictId());
            return;
        }

        eventPublisher.publish(new DocumentDeletedEvent(
            applicationContext,
            documentId,
            temple.getName(),
            documentType,
            documentName,
            deletedByUserId,
            dcIds[0]
        ));
        log.info("Published DocumentDeletedEvent for document: {} to {} DC(s)", documentId, dcIds.length);
    }
}
