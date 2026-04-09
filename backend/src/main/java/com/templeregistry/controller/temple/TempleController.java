package com.templeregistry.controller.temple;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.*;
import com.templeregistry.dto.response.temple.*;
import com.templeregistry.service.temple.TempleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/temples")
@RequiredArgsConstructor
@Tag(name = "Temples", description = "Temple search, profile, and basic CRUD")
public class TempleController {

    private final TempleService templeService;

    @GetMapping
    @Operation(summary = "Search temples with geo + grade + keyword filters (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<TempleSearchResultResponse>>> search(
            TempleSearchFilterRequest filter) {
        return ResponseEntity.ok(ApiResponse.success("Temples retrieved.", templeService.search(filter)));
    }

    @PostMapping
    @Operation(summary = "Create a new temple (TEMPLE_AUTHORITY or SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<TempleResponse>> create(
            @Valid @RequestBody CreateTempleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Temple created.", templeService.create(request)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get temple detail by ID")
    public ResponseEntity<ApiResponse<TempleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Temple retrieved.", templeService.getById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update temple basic info (TEMPLE_AUTHORITY of own temple or SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<TempleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTempleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Temple updated.", templeService.update(id, request)));
    }
}
