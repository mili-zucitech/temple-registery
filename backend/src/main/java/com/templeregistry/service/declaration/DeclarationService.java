package com.templeregistry.service.declaration;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.declaration.*;

import java.util.List;

public interface DeclarationService {

    PaginatedResponse<DeclarationResponse> listByTemple(Long templeId, int page, int size);

    DeclarationResponse create(Long templeId, CreateDeclarationRequest request);

    DeclarationResponse getById(Long id);

    DeclarationResponse update(Long id, CreateDeclarationRequest request);

    void submit(Long id);

    void approve(Long id);

    void reject(Long id, ClarificationRequest reason);

    void requestClarification(Long id, ClarificationRequest request);

    void flagPhysicalVerification(Long id, FlagPhysicalVerificationRequest request);

    void resubmit(Long id, ResubmitDeclarationRequest request);

    AcknowledgementResponse getAcknowledgement(Long id);

    /** Returns field-level diff between the last submission snapshot and current state. */
    List<DeclarationDiffResponse> getDiff(Long id);

    /** SA-only: force a SUBMITTED declaration back to DRAFT — logged in audit trail. */
    void forceDraft(Long id);

    /** SA: list declarations stuck in PHYSICAL_VERIFICATION_REQUESTED beyond 30 days. */
    PaginatedResponse<DeclarationResponse> getPhysicalVerificationPending(int page, int size);

    /** Scheduled job: flag overdue declarations */
    void flagOverdue();
}
