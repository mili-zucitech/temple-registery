package com.templeregistry.controller.contractor;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.contractor.CreateContractorRequest;
import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.service.contractor.ContractorService;
import com.templeregistry.security.RoleConstants;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Contractors", description = "Contractor and service provider management")
@RequestMapping("/api/v1")
public class ContractorController {

    private final ContractorService contractorService;

    @GetMapping("/temples/{templeId}/contractors")
    @PreAuthorize(RoleConstants.CAN_READ_ALL + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public ResponseEntity<ApiResponse<PaginatedResponse<ContractorResponse>>> list(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Contractors retrieved.",
                contractorService.listByTemple(templeId, page, size)));
    }

    @PostMapping("/temples/{templeId}/contractors")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<ContractorResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateContractorRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contractor created.", contractorService.create(templeId, rq)));
    }

    @GetMapping("/contractors/{id}")
    @PreAuthorize(RoleConstants.CAN_READ_ALL + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public ResponseEntity<ApiResponse<ContractorResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Contractor retrieved.", contractorService.getById(id)));
    }

    @PutMapping("/contractors/{id}")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<ContractorResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateContractorRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Contractor updated.", contractorService.update(id, rq)));
    }

    @DeleteMapping("/contractors/{id}")
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        contractorService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Contractor removed."));
    }
}
