package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.dc.DcContextResponse;
import com.templeregistry.entity.geo.District;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dc")
@RequiredArgsConstructor
@PreAuthorize(RoleConstants.CAN_WRITE_DC)
@Tag(name = "DC Context", description = "Current DC user identity and scope")
public class DcContextController {

    private final DistrictRepository districtRepository;
    private final UserRepository userRepository;

    @GetMapping("/me")
    @Operation(summary = "Returns the current authenticated user's DC context (role, district scope).")
    public ResponseEntity<ApiResponse<DcContextResponse>> me() {
        ScopeHelper.Claims claims = currentClaims();

        String districtName = null;
        Long cityId = null;
        if (claims.districtId() != null) {
            districtName = districtRepository.findById(claims.districtId())
                    .map(District::getName)
                    .orElse(null);
            cityId = districtRepository.findCityIdById(claims.districtId()).orElse(null);
        }

        String fullName = userRepository.findById(claims.userId())
                .map(u -> u.getFullName())
                .orElse(claims.username());
        boolean aadhaarVerified = userRepository.findById(claims.userId())
                .map(u -> u.isAadhaarVerified())
                .orElse(false);

        DcContextResponse response = DcContextResponse.builder()
                .userId(claims.userId())
                .username(claims.username())
                .fullName(fullName)
                .role(claims.role())
                .aadhaarVerified(aadhaarVerified)
                .districtId(claims.districtId())
                .districtName(districtName)
                .cityId(cityId)
                .build();

        return ResponseEntity.ok(ApiResponse.success("User context retrieved.", response));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
