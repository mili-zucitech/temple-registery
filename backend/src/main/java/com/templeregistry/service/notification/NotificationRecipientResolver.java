package com.templeregistry.service.notification;

import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.temple.TempleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for dynamically resolving notification recipients.
 * Finds all DCs for a district or all TAs for a temple.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationRecipientResolver {

    private final UserRepository userRepository;
    private final TempleRepository templeRepository;

    /**
     * Gets all District Collector user IDs for a given district.
     * Returns empty array if no DCs found.
     */
    public Long[] getDistrictCollectorIds(Long districtId) {
        if (districtId == null) {
            log.warn("Cannot resolve DCs: districtId is null");
            return new Long[0];
        }

        List<User> dcs = userRepository.findAllByRoleAndDistrictId(UserRole.DISTRICT_COLLECTOR, districtId);
        
        if (dcs.isEmpty()) {
            log.warn("No District Collectors found for district: {}", districtId);
            return new Long[0];
        }

        Long[] dcIds = dcs.stream()
                .map(User::getId)
                .toArray(Long[]::new);
        
        log.debug("Found {} DC(s) for district {}: {}", dcIds.length, districtId, dcIds);
        return dcIds;
    }

    /**
     * Gets all Temple Authority user IDs for a given temple.
     * Returns the temple creator and any linked TAs.
     */
    public Long[] getTempleAuthorityIds(Long templeId) {
        if (templeId == null) {
            log.warn("Cannot resolve TAs: templeId is null");
            return new Long[0];
        }

        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Temple not found: {}", templeId);
            return new Long[0];
        }

        List<Long> taIds = new ArrayList<>();

        // Add temple creator (primary TA)
        if (temple.getCreatedBy() != null) {
            taIds.add(temple.getCreatedBy());
        }

        // Add any other TAs linked to this temple
        User linkedTa = userRepository.findByTempleId(templeId).orElse(null);
        if (linkedTa != null && !taIds.contains(linkedTa.getId())) {
            taIds.add(linkedTa.getId());
        }

        if (taIds.isEmpty()) {
            log.warn("No Temple Authorities found for temple: {}", templeId);
            return new Long[0];
        }

        Long[] result = taIds.toArray(new Long[0]);
        log.debug("Found {} TA(s) for temple {}: {}", result.length, templeId, result);
        return result;
    }

    /**
     * Gets all District Collector user IDs for a temple's district.
     */
    public Long[] getDistrictCollectorsForTemple(Long templeId) {
        if (templeId == null) {
            log.warn("Cannot resolve DCs: templeId is null");
            return new Long[0];
        }

        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple == null) {
            log.warn("Temple not found: {}", templeId);
            return new Long[0];
        }

        return getDistrictCollectorIds(temple.getDistrictId());
    }

    /**
     * Gets temple name by ID.
     */
    public String getTempleName(Long templeId) {
        if (templeId == null) {
            return "Unknown Temple";
        }

        return templeRepository.findById(templeId)
                .map(Temple::getName)
                .orElse("Unknown Temple");
    }

    /**
     * Gets user's full name by ID.
     */
    public String getUserFullName(Long userId) {
        if (userId == null) {
            return "Unknown User";
        }

        return userRepository.findById(userId)
                .map(User::getFullName)
                .orElse("Unknown User");
    }

    /**
     * Gets district ID for a temple.
     */
    public Long getDistrictIdForTemple(Long templeId) {
        if (templeId == null) {
            return null;
        }

        return templeRepository.findById(templeId)
                .map(Temple::getDistrictId)
                .orElse(null);
    }
}
