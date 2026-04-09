package com.templeregistry.controller.contractor;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.contractor.CreateContractorRequest;
import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.service.contractor.ContractorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Contractors", description = "Contractor and service provider management")
public class ContractorController {

    private final ContractorService contractorService;

    @GetMapping("/api/v1/temples/{templeId}/contractors")
    public ResponseEntity<ApiResponse<PaginatedResponse<ContractorResponse>>> list(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Contractors retrieved.",
                contractorService.listByTemple(templeId, page, size)));
    }

    @PostMapping("/api/v1/temples/{templeId}/contractors")
    public ResponseEntity<ApiResponse<ContractorResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateContractorRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contractor created.", contractorService.create(templeId, rq)));
    }

    @GetMapping("/api/v1/contractors/{id}")
    public ResponseEntity<ApiResponse<ContractorResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Contractor retrieved.", contractorService.getById(id)));
    }

    @PutMapping("/api/v1/contractors/{id}")
    public ResponseEntity<ApiResponse<ContractorResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateContractorRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Contractor updated.", contractorService.update(id, rq)));
    }

    @DeleteMapping("/api/v1/contractors/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        contractorService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Contractor removed."));
    }
}
