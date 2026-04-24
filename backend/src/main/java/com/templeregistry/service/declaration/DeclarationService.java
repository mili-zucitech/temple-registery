package com.templeregistry.service.declaration;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.declaration.*;
import com.templeregistry.dto.response.dc.ClarificationItemResponse;

import java.util.List;

public interface DeclarationService {

    PaginatedResponse<DeclarationResponse> listByTemple(Long templeId, int page, int size);

    /**
     * DC/SA: list all declarations for a district, optionally filtered by status and financial year.
     */
    PaginatedResponse<DeclarationResponse> listByDistrict(Long districtId, String status, String financialYear, int page, int size);

    CompleteDeclarationResponse create(Long templeId, CreateDeclarationRequest request);

    CompleteDeclarationResponse getById(Long id);

    CompleteDeclarationResponse update(Long id, CreateDeclarationRequest request);

    void submit(Long id);

    /**
     * TA responds to a clarification request.
     * Transitions CLARIFICATION_REQUIRED → CLARIFICATION_RESPONDED.
     * Only the message is accepted — no asset field changes are allowed.
     */
    void respondToClarification(Long id, ClarificationRespondRequest request, Long actorId, String actorRole);

    void approve(Long id);

    void reject(Long id, ClarificationRequest reason);

    void requestClarification(Long id, ClarificationRequest request);

    void flagPhysicalVerification(Long id, FlagPhysicalVerificationRequest request);

    CompleteDeclarationResponse resubmit(Long id, ResubmitDeclarationRequest request);

    AcknowledgementResponse getAcknowledgement(Long id);

    /**
     * Returns field-level diff between the last submission snapshot and current
     * state.
     */
    List<DeclarationDiffResponse> getDiff(Long id, Integer compareToVersion);

    /** Clarification thread (visible to both DC and Temple Authority). */
    List<ClarificationItemResponse> listClarifications(Long declarationId);

    /** Version history for a declaration, newest submission first. */
    List<DeclarationVersionResponse> listVersions(Long declarationId);

    /**
     * Returns the audit log for a declaration.
     */
    List<com.templeregistry.dto.response.declaration.AuditLogEntry> listAuditLog(Long declarationId);

    /**
     * DC: paginated list of overdue declarations for a district.
     */
    PaginatedResponse<DeclarationResponse> listOverdue(Long districtId, int page, int size);

    /**
     * SA-only: force a SUBMITTED declaration back to DRAFT — logged in audit trail.
     */
    void forceDraft(Long id);

    /**
     * SA: list declarations stuck in PHYSICAL_VERIFICATION_REQUESTED beyond 30
     * days.
     */
    PaginatedResponse<DeclarationResponse> getPhysicalVerificationPending(int page, int size);

    /** Scheduled job: flag overdue declarations */
    void flagOverdue();
}
