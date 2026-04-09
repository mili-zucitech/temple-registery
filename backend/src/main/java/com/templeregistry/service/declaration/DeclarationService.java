package com.templeregistry.service.declaration;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.declaration.*;

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

    /** Scheduled job: flag overdue declarations */
    void flagOverdue();
}
