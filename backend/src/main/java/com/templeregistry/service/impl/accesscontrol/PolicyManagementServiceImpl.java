package com.templeregistry.service.impl.accesscontrol;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.accesscontrol.CreateFieldMaskRequest;
import com.templeregistry.dto.request.accesscontrol.CreatePolicyRequest;
import com.templeregistry.dto.request.accesscontrol.UpdatePolicyRequest;
import com.templeregistry.dto.response.accesscontrol.FieldMaskResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyMatrixResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyResponse;
import com.templeregistry.entity.accesscontrol.AccessControlFieldMask;
import com.templeregistry.entity.accesscontrol.AccessControlPolicy;
import com.templeregistry.entity.accesscontrol.enums.AuditChangeType;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.accesscontrol.AccessControlFieldMaskRepository;
import com.templeregistry.repository.accesscontrol.AccessControlPolicyRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.accesscontrol.AccessControlAuditService;
import com.templeregistry.service.accesscontrol.PolicyEvaluationService;
import com.templeregistry.service.accesscontrol.PolicyManagementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyManagementServiceImpl implements PolicyManagementService {

    private final AccessControlPolicyRepository policyRepository;
    private final AccessControlFieldMaskRepository fieldMaskRepository;
    private final AccessControlAuditService auditService;
    private final PolicyEvaluationService evaluationService;
    private final ObjectMapper objectMapper;

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public Page<PolicyResponse> listPolicies(Pageable pageable) {
        int size = Math.min(pageable.getPageSize(), 100);
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
        return policyRepository.findAll(bounded).map(this::toResponse);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public PolicyResponse createPolicy(CreatePolicyRequest request) {
        AccessControlPolicy policy = AccessControlPolicy.builder()
                .targetType(request.getTargetType())
                .targetKey(request.getTargetKey())
                .subjectType(request.getSubjectType())
                .subjectValue(request.getSubjectValue())
                .effect(request.getEffect())
                .active(request.isActive())
                .conditions(request.getConditions())
                .build();
        AccessControlPolicy saved = policyRepository.save(policy);
        auditService.logPolicyChange(saved.getId(), AuditChangeType.CREATE,
                null, toJson(saved), currentUserId(), currentIp());
        evaluationService.invalidateCache(saved.getTargetKey());
        log.info("DACVM policy created id={} target={} subject={}:{}",
                saved.getId(), saved.getTargetKey(), saved.getSubjectType(), saved.getSubjectValue());
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public PolicyResponse updatePolicy(Long id, UpdatePolicyRequest request) {
        AccessControlPolicy policy = findPolicyOrThrow(id);
        String oldJson = toJson(policy);
        policy.setEffect(request.getEffect());
        policy.setActive(request.getActive());
        if (request.getConditions() != null) {
            policy.setConditions(request.getConditions());
        }
        AccessControlPolicy saved = policyRepository.save(policy);
        auditService.logPolicyChange(saved.getId(), AuditChangeType.UPDATE,
                oldJson, toJson(saved), currentUserId(), currentIp());
        evaluationService.invalidateCache(saved.getTargetKey());
        log.info("DACVM policy updated id={} target={}", saved.getId(), saved.getTargetKey());
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void deletePolicy(Long id) {
        AccessControlPolicy policy = findPolicyOrThrow(id);
        String oldJson = toJson(policy);
        policyRepository.deleteById(id);
        auditService.logPolicyChange(id, AuditChangeType.DELETE,
                oldJson, null, currentUserId(), currentIp());
        evaluationService.invalidateCache(policy.getTargetKey());
        log.info("DACVM policy deleted id={}", id);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public List<PolicyResponse> batchUpsertPolicies(List<CreatePolicyRequest> requests) {
        List<PolicyResponse> results = new ArrayList<>();
        for (CreatePolicyRequest request : requests) {
            // Use a native query that ignores the @SQLRestriction so that soft-deleted
            // records are also found. Without this, deleting then re-enabling a policy
            // would hit the (target_key, subject_type, subject_value) unique constraint.
            policyRepository.findByTargetKeyAndSubjectIncludingDeleted(
                    request.getTargetKey(), request.getSubjectType().name(), request.getSubjectValue())
                    .ifPresentOrElse(existing -> {
                        existing.setEffect(request.getEffect());
                        existing.setActive(request.isActive());
                        existing.setDeleted(false); // restore if previously soft-deleted
                        AccessControlPolicy saved = policyRepository.save(existing);
                        evaluationService.invalidateCache(saved.getTargetKey());
                        results.add(toResponse(saved));
                    }, () -> results.add(createPolicy(request)));
        }
        return results;
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public PolicyMatrixResponse getPolicyMatrix() {
        List<AccessControlPolicy> all = policyRepository.findAll();

        List<String> roles = Arrays.stream(UserRole.values())
                .map(Enum::name)
                .toList();

        List<String> targetKeys = all.stream()
                .map(AccessControlPolicy::getTargetKey)
                .distinct()
                .sorted()
                .toList();

        // Build matrix: targetKey → role → effect string
        Map<String, Map<String, String>> matrix = new HashMap<>();
        for (String targetKey : targetKeys) {
            Map<String, String> roleMap = new HashMap<>();
            for (String role : roles) {
                roleMap.put(role, "DEFAULT_ALLOW");
            }
            matrix.put(targetKey, roleMap);
        }
        for (AccessControlPolicy p : all) {
            if (SubjectType.ROLE.equals(p.getSubjectType()) && p.isActive()) {
                matrix.computeIfAbsent(p.getTargetKey(), k -> new HashMap<>())
                        .put(p.getSubjectValue(), p.getEffect().name());
            }
        }

        return PolicyMatrixResponse.builder()
                .targetKeys(targetKeys)
                .roles(roles)
                .matrix(matrix)
                .build();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public Page<FieldMaskResponse> listFieldMasks(Pageable pageable) {
        int size = Math.min(pageable.getPageSize(), 100);
        Pageable bounded = PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
        return fieldMaskRepository.findAll(bounded).map(this::toFieldMaskResponse);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public FieldMaskResponse createOrUpdateFieldMask(CreateFieldMaskRequest request) {
        AccessControlFieldMask mask = fieldMaskRepository
                .findByFieldKeyAndSubjectTypeAndSubjectValue(
                        request.getFieldKey(), request.getSubjectType(), request.getSubjectValue())
                .orElseGet(() -> AccessControlFieldMask.builder()
                        .fieldKey(request.getFieldKey())
                        .subjectType(request.getSubjectType())
                        .subjectValue(request.getSubjectValue())
                        .build());

        String oldJson = mask.getId() != null ? toJson(mask) : null;
        mask.setMaskEnabled(request.isMaskEnabled());
        mask.setMaskPattern(request.getMaskPattern() != null ? request.getMaskPattern() : "****");
        mask.setActive(true);
        AccessControlFieldMask saved = fieldMaskRepository.save(mask);

        AuditChangeType changeType = oldJson == null ? AuditChangeType.CREATE : AuditChangeType.UPDATE;
        auditService.logFieldMaskChange(saved.getId(), changeType,
                oldJson, toJson(saved), currentUserId(), currentIp());
        evaluationService.invalidateCacheForSubject(
                saved.getSubjectType().name(), saved.getSubjectValue());

        log.info("DACVM field mask {}: field={} subject={}:{}", changeType,
                saved.getFieldKey(), saved.getSubjectType(), saved.getSubjectValue());
        return toFieldMaskResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void deleteFieldMask(Long id) {
        AccessControlFieldMask mask = fieldMaskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AccessControlFieldMask", id));
        String oldJson = toJson(mask);
        fieldMaskRepository.deleteById(id);
        auditService.logFieldMaskChange(id, AuditChangeType.DELETE,
                oldJson, null, currentUserId(), currentIp());
        evaluationService.invalidateCacheForSubject(
                mask.getSubjectType().name(), mask.getSubjectValue());
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private AccessControlPolicy findPolicyOrThrow(Long id) {
        return policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AccessControlPolicy", id));
    }

    private PolicyResponse toResponse(AccessControlPolicy p) {
        return PolicyResponse.builder()
                .id(p.getId())
                .targetType(p.getTargetType())
                .targetKey(p.getTargetKey())
                .subjectType(p.getSubjectType())
                .subjectValue(p.getSubjectValue())
                .effect(p.getEffect())
                .active(p.isActive())
                .conditions(p.getConditions())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private FieldMaskResponse toFieldMaskResponse(AccessControlFieldMask m) {
        return FieldMaskResponse.builder()
                .id(m.getId())
                .fieldKey(m.getFieldKey())
                .subjectType(m.getSubjectType().name())
                .subjectValue(m.getSubjectValue())
                .maskEnabled(m.isMaskEnabled())
                .maskPattern(m.getMaskPattern())
                .active(m.isActive())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private Long currentUserId() {
        try {
            return ScopeHelper.Claims.fromContext().userId();
        } catch (Exception e) {
            return 0L;
        }
    }

    private String currentIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            return (forwarded != null) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
