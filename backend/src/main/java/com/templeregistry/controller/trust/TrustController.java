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

import com.templeregistry.security.RoleConstants;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Trusts", description = "Trust registrations, board members, and financials")
@RequestMapping("/api/v1")
public class TrustController {

    private final TrustService trustService;

    @GetMapping("/temples/{templeId}/trusts")
    @Operation(summary = "List trust registrations for a temple")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TrustResponse>>> listByTemple(@PathVariable Long templeId) {
        return ResponseEntity.ok(ApiResponse.success("Trusts retrieved.", trustService.listByTemple(templeId)));
    }

    @PostMapping("/temples/{templeId}/trusts")
    @Operation(summary = "Create trust registration for a temple")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<TrustResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateTrustRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trust created.", trustService.create(templeId, rq)));
    }

    @GetMapping("/trusts/{id}")
    @Operation(summary = "Get trust detail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TrustResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Trust retrieved.", trustService.getById(id)));
    }

    @PutMapping("/trusts/{id}")
    @Operation(summary = "Update trust registration")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<TrustResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateTrustRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Trust updated.", trustService.update(id, rq)));
    }

    @GetMapping("/trusts/{trustId}/board-members")
    @Operation(summary = "List board members (current and past)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BoardMemberGroupResponse>> listBoardMembers(
            @PathVariable Long trustId,
            @RequestParam(required = false) Boolean current) {
        return ResponseEntity.ok(ApiResponse.success("Board members retrieved.", trustService.listBoardMembers(trustId, current)));
    }

    @PostMapping("/trusts/{trustId}/board-members")
    @Operation(summary = "Add a board member")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<BoardMemberResponse>> addBoardMember(
            @PathVariable Long trustId, @Valid @RequestBody CreateBoardMemberRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Board member added.", trustService.addBoardMember(trustId, rq)));
    }

    @PostMapping("/trusts/{trustId}/financials")
    @Operation(summary = "Submit annual financials for a trust (VAL-013: one record per FY)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<Void>> submitFinancial(
            @PathVariable Long trustId, @Valid @RequestBody SubmitTrustFinancialRequest rq) {
        trustService.submitFinancial(trustId, rq);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Financials submitted."));
    }

    @GetMapping("/trusts/{trustId}/financials")
    @Operation(summary = "List all submitted financial years for a trust")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TrustFinancialResponse>>> listFinancials(
            @PathVariable Long trustId) {
        return ResponseEntity.ok(ApiResponse.success("Financials retrieved.",
                trustService.listFinancials(trustId)));
    }

    @PutMapping("/trusts/{trustId}/board-members/{memberId}")
    @Operation(summary = "Update a board member (isCurrent=false requires tenureEndDate per VAL-014)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<BoardMemberResponse>> updateBoardMember(
            @PathVariable Long trustId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateBoardMemberRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Board member updated.",
                trustService.updateBoardMember(trustId, memberId, rq)));
    }

    @DeleteMapping("/trusts/{trustId}/board-members/{memberId}")
    @Operation(summary = "Soft-delete a board member")
    @PreAuthorize(RoleConstants.CAN_SUBMIT + " or " + RoleConstants.ADMIN_ONLY)
    public ResponseEntity<ApiResponse<Void>> deleteBoardMember(
            @PathVariable Long trustId,
            @PathVariable Long memberId) {
        trustService.deleteBoardMember(trustId, memberId);
        return ResponseEntity.ok(ApiResponse.success("Board member deleted."));
    }

    @PostMapping("/trusts/{trustId}/meetings")
    @Operation(summary = "Record a board meeting")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<BoardMeetingResponse>> createBoardMeeting(
            @PathVariable Long trustId, @Valid @RequestBody CreateBoardMeetingRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Board meeting recorded.",
                        trustService.createBoardMeeting(trustId, rq)));
    }

    @GetMapping("/trusts/{trustId}/meetings")
    @Operation(summary = "List board meetings for a trust (paginated, most recent first)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<BoardMeetingResponse>>> listBoardMeetings(
            @PathVariable Long trustId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Board meetings retrieved.",
                trustService.listBoardMeetings(trustId, page, size)));
    }

    @GetMapping("/trusts/{trustId}/meetings/{meetingId}")
    @Operation(summary = "Get a single board meeting by ID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BoardMeetingResponse>> getBoardMeeting(
            @PathVariable Long trustId, @PathVariable Long meetingId) {
        return ResponseEntity.ok(ApiResponse.success("Board meeting retrieved.",
                trustService.getBoardMeeting(trustId, meetingId)));
    }

    @PostMapping(value = "/trusts/{trustId}/meetings/{meetingId}/minutes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload meeting minutes PDF (max 10MB)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<BoardMeetingResponse>> uploadMeetingMinutes(
            @PathVariable Long trustId,
            @PathVariable Long meetingId,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Meeting minutes uploaded.",
                trustService.uploadMeetingMinutes(trustId, meetingId, file)));
    }

    @GetMapping("/trusts/{trustId}/meetings/{meetingId}/minutes/download")
    @Operation(summary = "Download meeting minutes PDF")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadMeetingMinutes(
            @PathVariable Long trustId,
            @PathVariable Long meetingId) {
        Resource resource = trustService.downloadMeetingMinutes(trustId, meetingId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"meeting-minutes-" + meetingId + ".pdf\"")
                .body(resource);
    }

    @DeleteMapping("/trusts/{id}")
    @Operation(summary = "Soft-delete a trust")
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public ResponseEntity<ApiResponse<Void>> deleteTrust(@PathVariable Long id) {
        trustService.deleteTrust(id);
        return ResponseEntity.ok(ApiResponse.success("Trust deleted."));
    }
}
