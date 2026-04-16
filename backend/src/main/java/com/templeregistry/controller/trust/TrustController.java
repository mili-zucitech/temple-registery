package com.templeregistry.controller.trust;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.service.trust.TrustService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.RequestParam;
import com.templeregistry.common.PaginatedResponse;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Trusts", description = "Trust lifecycle and Board Member management")
public class TrustController {

    private final TrustService trustService;

    // --- Trust APIs ---

    @PostMapping("/temples/{templeId}/trusts")
    @Operation(summary = "Create a new trust for a temple")
    public ResponseEntity<ApiResponse<TrustResponse>> createTrust(
            @PathVariable Long templeId, @Valid @RequestBody CreateTrustRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trust created successfully.", trustService.createTrust(templeId, request)));
    }

    @GetMapping("/temples/{templeId}/trusts")
    @Operation(summary = "Get all trusts (active and dissolved) for a temple")
    public ResponseEntity<ApiResponse<List<TrustResponse>>> getTrustsByTemple(@PathVariable Long templeId) {
        return ResponseEntity.ok(ApiResponse.success("Trusts retrieved successfully.", trustService.getTrustsByTemple(templeId)));
    }

    @PutMapping("/trusts/{id}")
    @Operation(summary = "Update an active trust")
    public ResponseEntity<ApiResponse<TrustResponse>> updateTrust(
            @PathVariable Long id, @Valid @RequestBody UpdateTrustRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Trust updated successfully.", trustService.updateTrust(id, request)));
    }

    @PutMapping("/trusts/{id}/dissolve")
    @Operation(summary = "Dissolve an active trust")
    public ResponseEntity<ApiResponse<TrustResponse>> dissolveTrust(
            @PathVariable Long id, @Valid @RequestBody DissolveTrustRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Trust dissolved successfully.", trustService.dissolveTrust(id, request)));
    }

    @PutMapping("/trusts/{id}/submit-for-review")
    @Operation(summary = "Submit trust and board details for DC review")
    public ResponseEntity<ApiResponse<TrustResponse>> submitForReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Trust submitted for DC review successfully.", trustService.submitForReview(id)));
    }

    // --- Board Member APIs ---

    @PostMapping("/trusts/{trustId}/board-members")
    @Operation(summary = "Add a board member to an active trust")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> addBoardMember(
            @PathVariable Long trustId, @Valid @RequestBody CreateBoardMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Board member added successfully.", trustService.addBoardMember(trustId, request)));
    }

    @GetMapping("/trusts/{trustId}/board-members")
    @Operation(summary = "Get all board members (current and historical) for a trust")
    public ResponseEntity<ApiResponse<PaginatedResponse<BoardMemberResponse>>> getBoardMembersByTrust(
            @PathVariable Long trustId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Board members retrieved successfully.", trustService.getBoardMembersByTrust(trustId, page, size)));
    }

    @PutMapping("/board-members/{id}")
    @Operation(summary = "Update a current board member")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> updateBoardMember(
            @PathVariable Long id, @Valid @RequestBody UpdateBoardMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Board member updated successfully.", trustService.updateBoardMember(id, request)));
    }

    @PutMapping("/board-members/{id}/resign")
    @Operation(summary = "Mark a board member as resigned")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> resignBoardMember(
            @PathVariable Long id, @Valid @RequestBody ResignBoardMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Board member resigned successfully.", trustService.resignBoardMember(id, request)));
    }
}
