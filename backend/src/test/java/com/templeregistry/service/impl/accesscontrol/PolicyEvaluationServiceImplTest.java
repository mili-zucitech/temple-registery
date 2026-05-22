package com.templeregistry.service.impl.accesscontrol;

import com.templeregistry.entity.accesscontrol.AccessControlFieldMask;
import com.templeregistry.entity.accesscontrol.AccessControlPolicy;
import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.repository.accesscontrol.AccessControlFieldMaskRepository;
import com.templeregistry.repository.accesscontrol.AccessControlPolicyRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyEvaluationServiceImplTest {

    @Mock AccessControlPolicyRepository policyRepository;
    @Mock AccessControlFieldMaskRepository fieldMaskRepository;
    @InjectMocks PolicyEvaluationServiceImpl service;

    // ─── isAllowed ────────────────────────────────────────────────────────────

    @Nested
    class IsAllowed {

        @Test
        void should_returnTrue_when_superAdminRegardlessOfPolicy() {
            // SUPER_ADMIN always allowed — no repository call needed
            boolean result = service.isAllowed("button.ta.employees.add",
                    SubjectType.ROLE.name(), "SUPER_ADMIN");
            assertThat(result).isTrue();
            verifyNoInteractions(policyRepository);
        }

        @Test
        void should_returnTrue_when_noPolicyExistsForTarget() {
            when(policyRepository.findAllByTargetKeyAndActiveTrue("button.ta.employees.add"))
                    .thenReturn(List.of());
            boolean result = service.isAllowed("button.ta.employees.add",
                    SubjectType.ROLE.name(), "TEMPLE_AUTHORITY");
            assertThat(result).isTrue();
        }

        @Test
        void should_returnFalse_when_roleLevelDenyPolicyExists() {
            AccessControlPolicy denyPolicy = buildPolicy(
                    SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.DENY);
            when(policyRepository.findAllByTargetKeyAndActiveTrue("button.ta.employees.add"))
                    .thenReturn(List.of(denyPolicy));

            boolean result = service.isAllowed("button.ta.employees.add",
                    SubjectType.ROLE.name(), "TEMPLE_AUTHORITY");

            assertThat(result).isFalse();
        }

        @Test
        void should_returnTrue_when_roleLevelAllowPolicyExists() {
            AccessControlPolicy allowPolicy = buildPolicy(
                    SubjectType.ROLE, "DISTRICT_COLLECTOR", PolicyEffect.ALLOW);
            when(policyRepository.findAllByTargetKeyAndActiveTrue("page.dc.export"))
                    .thenReturn(List.of(allowPolicy));

            boolean result = service.isAllowed("page.dc.export",
                    SubjectType.ROLE.name(), "DISTRICT_COLLECTOR");

            assertThat(result).isTrue();
        }

        @Test
        void should_returnFalse_when_userLevelDenyOverridesRoleAllow() {
            // Role-level ALLOW exists, but USER-level DENY should win
            AccessControlPolicy roleAllow = buildPolicy(
                    SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.ALLOW);
            AccessControlPolicy userDeny = buildPolicy(
                    SubjectType.USER, "42", PolicyEffect.DENY);
            when(policyRepository.findAllByTargetKeyAndActiveTrue("button.ta.employees.add"))
                    .thenReturn(List.of(roleAllow, userDeny));

            boolean result = service.isAllowed("button.ta.employees.add",
                    SubjectType.USER.name(), "42");

            assertThat(result).isFalse();
        }

        @Test
        void should_returnTrue_when_targetKeyForDifferentRole() {
            // Policy exists for TEMPLE_AUTHORITY but current subject is AUDITOR — no match → ALLOW
            AccessControlPolicy denyForTA = buildPolicy(
                    SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.DENY);
            when(policyRepository.findAllByTargetKeyAndActiveTrue("button.ta.employees.add"))
                    .thenReturn(List.of(denyForTA));

            boolean result = service.isAllowed("button.ta.employees.add",
                    SubjectType.ROLE.name(), "AUDITOR");

            assertThat(result).isTrue();
        }
    }

    // ─── getEffectivePermissions ───────────────────────────────────────────────

    @Nested
    class GetEffectivePermissions {

        @Test
        void should_returnEmptyMaps_when_noPoliciesOrMasksExist() {
            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(
                    SubjectType.ROLE, "AUDITOR")).thenReturn(List.of());
            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(
                    SubjectType.USER, "5")).thenReturn(List.of());
            when(fieldMaskRepository.findAllActiveMasksForSubject(
                    SubjectType.ROLE, "AUDITOR")).thenReturn(List.of());
            when(fieldMaskRepository.findAllActiveMasksForSubject(
                    SubjectType.USER, "5")).thenReturn(List.of());

            var result = service.getEffectivePermissions("AUDITOR", 5L);

            assertThat(result.getPermissions()).isEmpty();
            assertThat(result.getFieldMasks()).isEmpty();
        }

        @Test
        void should_includeRolePolicies_when_rolePoliciesExist() {
            AccessControlPolicy p1 = buildPolicy(SubjectType.ROLE, "AUDITOR", PolicyEffect.ALLOW);
            p1.setTargetKey("report.auditor.evidence_pack");

            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(
                    SubjectType.ROLE, "AUDITOR")).thenReturn(List.of(p1));
            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(
                    SubjectType.USER, "7")).thenReturn(List.of());
            when(fieldMaskRepository.findAllActiveMasksForSubject(
                    SubjectType.ROLE, "AUDITOR")).thenReturn(List.of());
            when(fieldMaskRepository.findAllActiveMasksForSubject(
                    SubjectType.USER, "7")).thenReturn(List.of());

            var result = service.getEffectivePermissions("AUDITOR", 7L);

            assertThat(result.getPermissions())
                    .containsEntry("report.auditor.evidence_pack", "ALLOW");
        }

        @Test
        void should_overrideRolePolicyWithUserPolicy_when_bothExist() {
            AccessControlPolicy roleAllow = buildPolicy(SubjectType.ROLE, "TEMPLE_AUTHORITY", PolicyEffect.ALLOW);
            roleAllow.setTargetKey("button.ta.employees.add");
            AccessControlPolicy userDeny = buildPolicy(SubjectType.USER, "99", PolicyEffect.DENY);
            userDeny.setTargetKey("button.ta.employees.add");

            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(
                    SubjectType.ROLE, "TEMPLE_AUTHORITY")).thenReturn(List.of(roleAllow));
            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(
                    SubjectType.USER, "99")).thenReturn(List.of(userDeny));
            when(fieldMaskRepository.findAllActiveMasksForSubject(any(), any()))
                    .thenReturn(List.of());

            var result = service.getEffectivePermissions("TEMPLE_AUTHORITY", 99L);

            assertThat(result.getPermissions())
                    .containsEntry("button.ta.employees.add", "DENY");
        }

        @Test
        void should_includeFieldMasks_when_masksConfiguredForRole() {
            AccessControlFieldMask mask = AccessControlFieldMask.builder()
                    .fieldKey("field.temple.bank_account")
                    .subjectType(SubjectType.ROLE)
                    .subjectValue("DC_STAFF")
                    .maskEnabled(true)
                    .maskPattern("****")
                    .active(true)
                    .build();

            when(policyRepository.findAllBySubjectTypeAndSubjectValueAndActiveTrue(any(), any()))
                    .thenReturn(List.of());
            when(fieldMaskRepository.findAllActiveMasksForSubject(SubjectType.ROLE, "DC_STAFF"))
                    .thenReturn(List.of(mask));
            when(fieldMaskRepository.findAllActiveMasksForSubject(SubjectType.USER, "3"))
                    .thenReturn(List.of());

            var result = service.getEffectivePermissions("DC_STAFF", 3L);

            assertThat(result.getFieldMasks())
                    .containsEntry("field.temple.bank_account", "****");
        }
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private AccessControlPolicy buildPolicy(SubjectType subjectType,
                                            String subjectValue,
                                            PolicyEffect effect) {
        AccessControlPolicy p = new AccessControlPolicy();
        p.setSubjectType(subjectType);
        p.setSubjectValue(subjectValue);
        p.setEffect(effect);
        p.setActive(true);
        return p;
    }
}
