package com.templeregistry.service.impl.accesscontrol;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.accesscontrol.CreatePolicyRequest;
import com.templeregistry.dto.request.accesscontrol.UpdatePolicyRequest;
import com.templeregistry.entity.accesscontrol.AccessControlPolicy;
import com.templeregistry.entity.accesscontrol.enums.AuditChangeType;
import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.entity.accesscontrol.enums.TargetType;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.accesscontrol.AccessControlFieldMaskRepository;
import com.templeregistry.repository.accesscontrol.AccessControlPolicyRepository;
import com.templeregistry.service.accesscontrol.AccessControlAuditService;
import com.templeregistry.service.accesscontrol.PolicyEvaluationService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyManagementServiceImplTest {

    @Mock AccessControlPolicyRepository policyRepository;
    @Mock AccessControlFieldMaskRepository fieldMaskRepository;
    @Mock AccessControlAuditService auditService;
    @Mock PolicyEvaluationService evaluationService;
    @Mock ObjectMapper objectMapper;
    @InjectMocks PolicyManagementServiceImpl service;

    // ─── createPolicy ─────────────────────────────────────────────────────────

    @Nested
    class CreatePolicy {

        @Test
        void should_savePolicy_when_validRequestProvided() {
            CreatePolicyRequest request = buildCreateRequest(
                    "button.ta.employees.add", SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.DENY);
            AccessControlPolicy saved = buildSavedPolicy(1L, request);
            when(policyRepository.save(any())).thenReturn(saved);

            var result = service.createPolicy(request);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getTargetKey()).isEqualTo("button.ta.employees.add");
            assertThat(result.getEffect()).isEqualTo(PolicyEffect.DENY);
            verify(policyRepository).save(any(AccessControlPolicy.class));
        }

        @Test
        void should_logAuditEntry_when_policyCreated() throws Exception {
            CreatePolicyRequest request = buildCreateRequest(
                    "page.dc.export", SubjectType.ROLE, "DC_STAFF", PolicyEffect.DENY);
            AccessControlPolicy saved = buildSavedPolicy(2L, request);
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");
            when(policyRepository.save(any())).thenReturn(saved);

            service.createPolicy(request);

            verify(auditService).logPolicyChange(
                    eq(2L), eq(AuditChangeType.CREATE),
                    isNull(), anyString(), any(), anyString());
        }

        @Test
        void should_invalidateCache_when_policyCreated() {
            CreatePolicyRequest request = buildCreateRequest(
                    "page.dc.export", SubjectType.ROLE, "DC_STAFF", PolicyEffect.DENY);
            AccessControlPolicy saved = buildSavedPolicy(3L, request);
            when(policyRepository.save(any())).thenReturn(saved);

            service.createPolicy(request);

            verify(evaluationService).invalidateCache("page.dc.export");
        }
    }

    // ─── updatePolicy ─────────────────────────────────────────────────────────

    @Nested
    class UpdatePolicy {

        @Test
        void should_updateEffectAndActive_when_policyExists() throws Exception {
            AccessControlPolicy existing = buildSavedPolicy(10L,
                    buildCreateRequest("section.admin.users", SubjectType.ROLE, "VIEWER", PolicyEffect.ALLOW));
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");
            when(policyRepository.findById(10L)).thenReturn(Optional.of(existing));
            when(policyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdatePolicyRequest update = new UpdatePolicyRequest();
            update.setEffect(PolicyEffect.DENY);
            update.setActive(false);

            var result = service.updatePolicy(10L, update);

            assertThat(result.getEffect()).isEqualTo(PolicyEffect.DENY);
            assertThat(result.isActive()).isFalse();
            verify(auditService).logPolicyChange(
                    eq(10L), eq(AuditChangeType.UPDATE),
                    anyString(), anyString(), any(), anyString());
        }

        @Test
        void should_throwEntityNotFoundException_when_policyDoesNotExist() {
            when(policyRepository.findById(99L)).thenReturn(Optional.empty());

            UpdatePolicyRequest update = new UpdatePolicyRequest();
            update.setEffect(PolicyEffect.DENY);
            update.setActive(true);

            assertThatThrownBy(() -> service.updatePolicy(99L, update))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(policyRepository, never()).save(any());
        }
    }

    // ─── deletePolicy ─────────────────────────────────────────────────────────

    @Nested
    class DeletePolicy {

        @Test
        void should_softDeletePolicy_when_policyExists() throws Exception {
            AccessControlPolicy existing = buildSavedPolicy(5L,
                    buildCreateRequest("tab.temple.governance", SubjectType.ROLE, "AUDITOR", PolicyEffect.DENY));
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");
            when(policyRepository.findById(5L)).thenReturn(Optional.of(existing));

            service.deletePolicy(5L);

            verify(policyRepository).deleteById(5L);
            verify(auditService).logPolicyChange(
                    eq(5L), eq(AuditChangeType.DELETE),
                    anyString(), isNull(), any(), anyString());
            verify(evaluationService).invalidateCache("tab.temple.governance");
        }

        @Test
        void should_throwEntityNotFoundException_when_policyNotFound() {
            when(policyRepository.findById(88L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deletePolicy(88L))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(policyRepository, never()).deleteById(any());
        }
    }

    // ─── batchUpsertPolicies ──────────────────────────────────────────────────

    @Nested
    class BatchUpsertPolicies {

        @Test
        void should_updateExistingPolicy_when_matchFound() {
            CreatePolicyRequest request = buildCreateRequest(
                    "button.ta.employees.add", SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.DENY);
            AccessControlPolicy existing = buildSavedPolicy(20L,
                    buildCreateRequest("button.ta.employees.add", SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.ALLOW));

            when(policyRepository.findByTargetKeyAndSubjectIncludingDeleted(
                    "button.ta.employees.add", "ROLE", "TEMPLE_AUTHORITY"))
                    .thenReturn(Optional.of(existing));
            when(policyRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var results = service.batchUpsertPolicies(List.of(request));

            assertThat(results).hasSize(1);
            // Effect should be updated to DENY
            ArgumentCaptor<AccessControlPolicy> captor = ArgumentCaptor.forClass(AccessControlPolicy.class);
            verify(policyRepository).save(captor.capture());
            assertThat(captor.getValue().getEffect()).isEqualTo(PolicyEffect.DENY);
        }

        @Test
        void should_createNewPolicy_when_noExistingMatch() {
            CreatePolicyRequest request = buildCreateRequest(
                    "page.dc.export", SubjectType.ROLE, "DC_STAFF", PolicyEffect.DENY);
            AccessControlPolicy saved = buildSavedPolicy(21L, request);

            when(policyRepository.findByTargetKeyAndSubjectIncludingDeleted(any(), any(), any()))
                    .thenReturn(Optional.empty());
            // createPolicy will be called internally — stub the save
            when(policyRepository.save(any())).thenReturn(saved);

            var results = service.batchUpsertPolicies(List.of(request));

            assertThat(results).hasSize(1);
            assertThat(results.get(0).getTargetKey()).isEqualTo("page.dc.export");
        }
    }

    // ─── listPolicies pagination guard ────────────────────────────────────────

    @Nested
    class ListPolicies {

        @Test
        void should_capPageSizeAt100_when_requestedSizeExceeds100() {
            when(policyRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            service.listPolicies(PageRequest.of(0, 500));

            ArgumentCaptor<org.springframework.data.domain.Pageable> captor =
                    ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
            verify(policyRepository).findAll(captor.capture());
            assertThat(captor.getValue().getPageSize()).isEqualTo(100);
        }
    }

    // ─── getPolicyMatrix ──────────────────────────────────────────────────────

    @Nested
    class GetPolicyMatrix {

        @Test
        void should_returnEmptyMatrix_when_noPoliciesExist() {
            when(policyRepository.findAll()).thenReturn(List.of());

            var result = service.getPolicyMatrix();

            assertThat(result.getTargetKeys()).isEmpty();
            assertThat(result.getRoles()).isNotEmpty();      // all UserRole values always present
            assertThat(result.getMatrix()).isEmpty();
        }

        @Test
        void should_populateMatrixWithEffect_when_rolePolicyExists() {
            AccessControlPolicy policy = buildSavedPolicy(1L,
                    buildCreateRequest("section.dc.search.declaration_status",
                            SubjectType.ROLE, "DISTRICT_COLLECTOR", PolicyEffect.DENY));

            when(policyRepository.findAll()).thenReturn(List.of(policy));

            var result = service.getPolicyMatrix();

            assertThat(result.getTargetKeys()).contains("section.dc.search.declaration_status");
            assertThat(result.getMatrix())
                    .containsKey("section.dc.search.declaration_status");
            assertThat(result.getMatrix()
                    .get("section.dc.search.declaration_status")
                    .get("DISTRICT_COLLECTOR"))
                    .isEqualTo("DENY");
        }

        @Test
        void should_defaultToDefaultAllow_when_roleHasNoExplicitPolicy() {
            AccessControlPolicy policy = buildSavedPolicy(2L,
                    buildCreateRequest("kpi.ta.search.total_temples",
                            SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.ALLOW));

            when(policyRepository.findAll()).thenReturn(List.of(policy));

            var result = service.getPolicyMatrix();

            // A role with no explicit policy for that key should get DEFAULT_ALLOW
            String dcEffect = result.getMatrix()
                    .getOrDefault("kpi.ta.search.total_temples", java.util.Map.of())
                    .getOrDefault("DISTRICT_COLLECTOR", "DEFAULT_ALLOW");
            assertThat(dcEffect).isEqualTo("DEFAULT_ALLOW");
        }

        @Test
        void should_ignoreInactivePolicies_when_buildingMatrix() {
            AccessControlPolicy inactivePolicy = buildSavedPolicy(3L,
                    buildCreateRequest("section.ta.search.saved_filters",
                            SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.DENY));
            inactivePolicy.setActive(false);

            when(policyRepository.findAll()).thenReturn(List.of(inactivePolicy));

            var result = service.getPolicyMatrix();

            // Inactive policies should not set an effect in the matrix
            String effect = result.getMatrix()
                    .getOrDefault("section.ta.search.saved_filters", java.util.Map.of())
                    .getOrDefault("TEMPLE_AUTHORITY", "DEFAULT_ALLOW");
            assertThat(effect).isEqualTo("DEFAULT_ALLOW");
        }
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private CreatePolicyRequest buildCreateRequest(String targetKey, SubjectType subjectType,
                                                   String subjectValue, PolicyEffect effect) {
        CreatePolicyRequest r = new CreatePolicyRequest();
        r.setTargetType(TargetType.BUTTON);
        r.setTargetKey(targetKey);
        r.setSubjectType(subjectType);
        r.setSubjectValue(subjectValue);
        r.setEffect(effect);
        r.setActive(true);
        return r;
    }

    private AccessControlPolicy buildSavedPolicy(Long id, CreatePolicyRequest request) {
        AccessControlPolicy p = new AccessControlPolicy();
        p.setId(id);
        p.setTargetKey(request.getTargetKey());
        p.setSubjectType(request.getSubjectType());
        p.setSubjectValue(request.getSubjectValue());
        p.setEffect(request.getEffect());
        p.setActive(request.isActive());
        return p;
    }
}
