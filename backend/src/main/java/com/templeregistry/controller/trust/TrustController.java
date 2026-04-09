package com.templeregistry.controller.trust;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;
import com.templeregistry.service.trust.TrustService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Trusts", description = "Trust registrations, board members, and financials")
public class TrustController {

    private final TrustService trustService;

    @GetMapping("/api/temples/{templeId}/trusts")
    @Operation(summary = "List trust registrations for a temple")
    public ResponseEntity<ApiResponse<List<TrustResponse>>> listByTemple(@PathVariable Long templeId) {
        return ResponseEntity.ok(ApiResponse.success("Trusts retrieved.", trustService.listByTemple(templeId)));
    }

    @PostMapping("/api/temples/{templeId}/trusts")
    @Operation(summary = "Create trust registration for a temple")
    public ResponseEntity<ApiResponse<TrustResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateTrustRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trust created.", trustService.create(templeId, rq)));
    }

    @GetMapping("/api/trusts/{id}")
    @Operation(summary = "Get trust detail")
    public ResponseEntity<ApiResponse<TrustResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Trust retrieved.", trustService.getById(id)));
    }

    @PutMapping("/api/trusts/{id}")
    @Operation(summary = "Update trust registration")
    public ResponseEntity<ApiResponse<TrustResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateTrustRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Trust updated.", trustService.update(id, rq)));
    }

    @GetMapping("/api/trusts/{trustId}/board-members")
    @Operation(summary = "List board members (current and past)")
    public ResponseEntity<ApiResponse<List<BoardMemberResponse>>> listBoardMembers(@PathVariable Long trustId) {
        return ResponseEntity.ok(ApiResponse.success("Board members retrieved.", trustService.listBoardMembers(trustId)));
    }

    @PostMapping("/api/trusts/{trustId}/board-members")
    @Operation(summary = "Add a board member")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> addBoardMember(
            @PathVariable Long trustId, @Valid @RequestBody CreateBoardMemberRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Board member added.", trustService.addBoardMember(trustId, rq)));
    }

    @PostMapping("/api/trusts/{trustId}/financials")
    @Operation(summary = "Submit annual financials for a trust")
    public ResponseEntity<ApiResponse<Void>> submitFinancial(
            @PathVariable Long trustId, @Valid @RequestBody SubmitTrustFinancialRequest rq) {
        trustService.submitFinancial(trustId, rq);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Financials submitted."));
    }
}
