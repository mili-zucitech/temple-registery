package com.templeregistry.controller.governance;

import com.templeregistry.dto.response.declaration.CompleteDeclarationResponse;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.dto.response.workflow.WorkflowEnvelope;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.declaration.DeclarationService;
import com.templeregistry.service.temple.TempleProfileStagingService;
import com.templeregistry.service.trust.TrustService;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.ActionContextResolver;
import com.templeregistry.service.workflow.WorkflowEnvelopeAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * [P5] GovernanceV2Controller
 * 
 * Provides unified WorkflowEnvelope responses for module-specific data.
 */
@RestController
@RequestMapping("/api/v2")
@RequiredArgsConstructor
@Tag(name = "Governance v2", description = "Module-specific governance envelopes")
public class GovernanceV2Controller {

    private final WorkflowEnvelopeAssembler assembler;
    private final DeclarationService declarationService;
    private final TrustService trustService;
    private final TempleProfileStagingService stagingService;
    private final ActionContextResolver actionContextResolver;

    @GetMapping("/declarations/{id}")
    @Operation(summary = "Get declaration data with full workflow context")
    public ResponseEntity<WorkflowEnvelope<CompleteDeclarationResponse>> getDeclaration(@PathVariable Long id, Authentication auth) {
        ScopeHelper.Claims claims = (ScopeHelper.Claims) auth.getPrincipal();
        ActionContext context = actionContextResolver.resolve(claims);
        CompleteDeclarationResponse data = declarationService.getById(id);
        return ResponseEntity.ok(assembler.assemble(WorkflowEntityType.DECLARATION, id, data, context));
    }

    @GetMapping("/trusts/{id}")
    @Operation(summary = "Get trust data with full workflow context")
    public ResponseEntity<WorkflowEnvelope<TrustResponse>> getTrust(@PathVariable Long id, Authentication auth) {
        ScopeHelper.Claims claims = (ScopeHelper.Claims) auth.getPrincipal();
        ActionContext context = actionContextResolver.resolve(claims);
        TrustResponse data = trustService.getById(id);
        return ResponseEntity.ok(assembler.assemble(WorkflowEntityType.TRUST, id, data, context));
    }

    @GetMapping("/temple-profile-staging/{id}")
    @Operation(summary = "Get temple profile staging data with full workflow context")
    public ResponseEntity<WorkflowEnvelope<TempleProfileStagingResponse>> getStaging(@PathVariable Long id, Authentication auth) {
        ScopeHelper.Claims claims = (ScopeHelper.Claims) auth.getPrincipal();
        ActionContext context = actionContextResolver.resolve(claims);
        TempleProfileStagingResponse data = stagingService.getById(id);
        return ResponseEntity.ok(assembler.assemble(WorkflowEntityType.TEMPLE_PROFILE, id, data, context));
    }
}
