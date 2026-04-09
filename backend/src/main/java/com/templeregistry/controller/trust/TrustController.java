package com.templeregistry.controller.trust;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
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
    @Operation(summary = "Submit annual financials for a trust (VAL-013: one record per FY)")
    public ResponseEntity<ApiResponse<Void>> submitFinancial(
            @PathVariable Long trustId, @Valid @RequestBody SubmitTrustFinancialRequest rq) {
        trustService.submitFinancial(trustId, rq);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Financials submitted."));
    }

    @GetMapping("/api/trusts/{trustId}/financials")
    @Operation(summary = "List all submitted financial years for a trust")
    public ResponseEntity<ApiResponse<List<TrustFinancialResponse>>> listFinancials(
            @PathVariable Long trustId) {
        return ResponseEntity.ok(ApiResponse.success("Financials retrieved.",
                trustService.listFinancials(trustId)));
    }

    @PutMapping("/api/trusts/{trustId}/board-members/{memberId}")
    @Operation(summary = "Update a board member (isCurrent=false requires tenureEndDate per VAL-014)")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> updateBoardMember(
            @PathVariable Long trustId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateBoardMemberRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Board member updated.",
                trustService.updateBoardMember(trustId, memberId, rq)));
    }

    @PostMapping("/api/trusts/{trustId}/meetings")
    @Operation(summary = "Record a board meeting")
    public ResponseEntity<ApiResponse<BoardMeetingResponse>> createBoardMeeting(
            @PathVariable Long trustId, @Valid @RequestBody CreateBoardMeetingRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Board meeting recorded.",
                        trustService.createBoardMeeting(trustId, rq)));
    }

    @GetMapping("/api/trusts/{trustId}/meetings")
    @Operation(summary = "List board meetings for a trust (paginated, most recent first)")
    public ResponseEntity<ApiResponse<PaginatedResponse<BoardMeetingResponse>>> listBoardMeetings(
            @PathVariable Long trustId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Board meetings retrieved.",
                trustService.listBoardMeetings(trustId, page, size)));
    }

    @GetMapping("/api/trusts/{trustId}/meetings/{meetingId}")
    @Operation(summary = "Get a single board meeting by ID")
    public ResponseEntity<ApiResponse<BoardMeetingResponse>> getBoardMeeting(
            @PathVariable Long trustId, @PathVariable Long meetingId) {
        return ResponseEntity.ok(ApiResponse.success("Board meeting retrieved.",
                trustService.getBoardMeeting(meetingId)));
    }
}
