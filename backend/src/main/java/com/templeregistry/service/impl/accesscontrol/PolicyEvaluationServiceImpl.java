package com.templeregistry.service.impl.accesscontrol;

import com.templeregistry.dto.response.accesscontrol.EffectivePermissionsResponse;
import com.templeregistry.entity.accesscontrol.AccessControlFieldMask;
import com.templeregistry.entity.accesscontrol.AccessControlPolicy;
import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.repository.accesscontrol.AccessControlFieldMaskRepository;
import com.templeregistry.repository.accesscontrol.AccessControlPolicyRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.accesscontrol.PolicyEvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyEvaluationServiceImpl implements PolicyEvaluationService {

    private static final String CACHE_NAME = "dacvmPolicies";

    private final AccessControlPolicyRepository policyRepository;
    private final AccessControlFieldMaskRepository fieldMaskRepository;

    /**
     * Evaluation order:
     * 1. SUPER_ADMIN → always ALLOW.
     * 2. USER-level DENY → DENY (highest priority override).
     * 3. ROLE-level DENY → DENY.
     * 4. No active DENY found → ALLOW (existing @PreAuthorize is the floor).
     */
    @Override
    @Cacheable(value = CACHE_NAME, key = "#targetKey + ':' + #subjectType + ':' + #subjectValue")
    @Transactional(readOnly = true)
    public boolean isAllowed(String targetKey, String subjectType, String subjectValue) {
        // SA is always allowed — never subject to DENY policies
        if (RoleConstants.SUPER_ADMIN.equals(subjectValue)
                || SubjectType.ROLE.name().equals(subjectType) && RoleConstants.SUPER_ADMIN.equals(subjectValue)) {
            return true;
        }

        // Check USER-level policy first (highest priority)
        if (SubjectType.USER.name().equals(subjectType)) {
            List<AccessControlPolicy> userPolicies = policyRepository
                    .findAllByTargetKeyAndActiveTrue(targetKey)
                    .stream()
                    .filter(p -> SubjectType.USER.equals(p.getSubjectType())
                            && subjectValue.equals(p.getSubjectValue()))
                    .toList();
            if (userPolicies.stream().anyMatch(p -> PolicyEffect.DENY.equals(p.getEffect()))) {
                log.debug("DACVM DENY (user-level): target={} userId={}", targetKey, subjectValue);
                return false;
            }
        }

        // Check ROLE-level policy
        List<AccessControlPolicy> rolePolicies = policyRepository
                .findAllByTargetKeyAndActiveTrue(targetKey)
                .stream()
                .filter(p -> SubjectType.ROLE.equals(p.getSubjectType())
                        && subjectValue.equals(p.getSubjectValue()))
                .toList();
        if (rolePolicies.stream().anyMatch(p -> PolicyEffect.DENY.equals(p.getEffect()))) {
            log.debug("DACVM DENY (role-level): target={} role={}", targetKey, subjectValue);
            return false;
        }

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public EffectivePermissionsResponse getEffectivePermissions(String role, Long userId) {
        String userIdStr = userId != null ? userId.toString() : "";

        // Batch-fetch all active policies for this role
        List<AccessControlPolicy> rolePolicies = policyRepository
                .findAllBySubjectTypeAndSubjectValueAndActiveTrue(SubjectType.ROLE, role);

        // Batch-fetch all active policies for this user
        List<AccessControlPolicy> userPolicies = policyRepository
                .findAllBySubjectTypeAndSubjectValueAndActiveTrue(SubjectType.USER, userIdStr);

        // Merge: user-level DENY overrides role-level ALLOW
        Map<String, String> permissions = new HashMap<>();

        for (AccessControlPolicy p : rolePolicies) {
            permissions.put(p.getTargetKey(), p.getEffect().name());
        }
        for (AccessControlPolicy p : userPolicies) {
            // USER-level always wins
            permissions.put(p.getTargetKey(), p.getEffect().name());
        }

        // Batch-fetch active field masks
        List<AccessControlFieldMask> roleMasks = fieldMaskRepository
                .findAllActiveMasksForSubject(SubjectType.ROLE, role);
        List<AccessControlFieldMask> userMasks = fieldMaskRepository
                .findAllActiveMasksForSubject(SubjectType.USER, userIdStr);

        Map<String, String> fieldMasks = new HashMap<>();
        for (AccessControlFieldMask m : roleMasks) {
            fieldMasks.put(m.getFieldKey(), m.getMaskPattern());
        }
        // User-level overrides role-level mask
        for (AccessControlFieldMask m : userMasks) {
            if (m.isMaskEnabled()) {
                fieldMasks.put(m.getFieldKey(), m.getMaskPattern());
            } else {
                fieldMasks.remove(m.getFieldKey());
            }
        }

        return EffectivePermissionsResponse.builder()
                .permissions(permissions)
                .fieldMasks(fieldMasks)
                .build();
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void invalidateCache(String targetKey) {
        log.debug("DACVM cache evicted for targetKey={}", targetKey);
    }

    @Override
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void invalidateCacheForSubject(String subjectType, String subjectValue) {
        log.debug("DACVM cache evicted for subject {}:{}", subjectType, subjectValue);
    }
}
