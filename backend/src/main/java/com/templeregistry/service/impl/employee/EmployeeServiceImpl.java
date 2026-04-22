package com.templeregistry.service.impl.employee;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.dc.ApproveEmployeeRequest;
import com.templeregistry.dto.request.dc.RejectEmployeeRequest;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.SubmitEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.SubmissionStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.employee.EmployeeService;
import com.templeregistry.service.notification.NotificationService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private static final Set<EmployeeStatus> TERMINAL_STATUSES = Set.of(EmployeeStatus.RETIRED, EmployeeStatus.RESIGNED);

    private final EmployeeRepository employeeRepository;
    private final TempleRepository templeRepository;
    private final OwnershipGuard ownershipGuard;
    private final JurisdictionGuard jurisdictionGuard;
    private final PaginationUtil paginationUtil;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<EmployeeResponse> listByTemple(Long templeId, int page, int size) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        ownershipGuard.assertOwnsTemple(templeId);
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        Page<Employee> result = employeeRepository.findAllByTempleId(
                templeId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public EmployeeResponse create(Long templeId, CreateEmployeeRequest rq) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        ownershipGuard.assertOwnsTemple(templeId);
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        Employee emp = Employee.builder()
                .templeId(templeId).fullName(rq.getFullName()).employeeType(rq.getEmployeeType())
                .employeeRef(rq.getEmployeeRef()).designation(rq.getDesignation())
                .dateOfJoining(rq.getDateOfJoining()).salaryGrade(rq.getSalaryGrade())
                .mobile(rq.getMobile()).address(rq.getAddress()).isHereditary(rq.isHereditary())
                .status(EmployeeStatus.ACTIVE)
                .submissionStatus(SubmissionStatus.DRAFT) // New employees start as DRAFT
                .build();
        Employee saved = employeeRepository.save(emp);
        log.info("Employee created: id=[{}] temple=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public EmployeeResponse getById(Long id) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return toResponse(emp);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public EmployeeResponse update(Long id, UpdateEmployeeRequest rq) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());

        // VAL-012: terminal state guard — RESIGNED/RETIRED → ACTIVE is blocked
        if (rq.getStatus() != null && rq.getStatus() == EmployeeStatus.ACTIVE
                && TERMINAL_STATUSES.contains(emp.getStatus())) {
            throw new IllegalStatusTransitionException(
                    "Employee in terminal status [" + emp.getStatus() + "] cannot be transitioned back to ACTIVE. "
                            + "Create a new employee record for re-hire. Error: TRM-EMP-TERMINAL");
        }

        // VAL-015: dateOfLeaving required when transitioning to a terminal status
        if (rq.getStatus() != null && TERMINAL_STATUSES.contains(rq.getStatus())
                && rq.getDateOfLeaving() == null) {
            throw new IllegalArgumentException(
                    "date_of_leaving is required when transitioning employee to " + rq.getStatus() + " (VAL-015).");
        }

        if (rq.getFullName() != null)       emp.setFullName(rq.getFullName());
        if (rq.getEmployeeType() != null)   emp.setEmployeeType(rq.getEmployeeType());
        if (rq.getDesignation() != null)    emp.setDesignation(rq.getDesignation());
        if (rq.getSalaryGrade() != null)    emp.setSalaryGrade(rq.getSalaryGrade());
        if (rq.getStatus() != null) {
            emp.setStatus(rq.getStatus());
            if (rq.getDateOfLeaving() != null) emp.setDateOfLeaving(rq.getDateOfLeaving());
        }

        // Auto-reset: TA edit after DC verification resets status to DRAFT
        if (emp.getSubmissionStatus() == SubmissionStatus.APPROVED || emp.getSubmissionStatus() == SubmissionStatus.REJECTED) {
            emp.setSubmissionStatus(SubmissionStatus.DRAFT);
            emp.setReviewedAt(null);
            emp.setReviewedBy(null);
            emp.setReviewRemarks(null);
            log.info("Employee [{}] submission status reset to DRAFT after TA update", id);
        }

        // Reset DC verification flags if edited after verification
        if (emp.isVerifiedByDc()) {
            emp.setVerifiedByDc(false);
            emp.setVerifiedByDcAt(null);
            emp.setVerifiedByDcUserId(null);
            emp.setDcFlagReason(null);
            log.info("Employee [{}] verification reset after TA update", id);
        }

        log.info("Employee updated: id=[{}] newStatus=[{}]", id, emp.getStatus());
        return toResponse(employeeRepository.save(emp));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void softDelete(Long id) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        employeeRepository.deleteById(id); // @SQLDelete intercepts to UPDATE
        log.info("Employee soft-deleted: id=[{}]", id);
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    private Employee findOrThrow(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Employee", id));
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
            .id(e.getId()).templeId(e.getTempleId()).fullName(e.getFullName())
            .employeeType(e.getEmployeeType()).employeeRef(e.getEmployeeRef())
            .designation(e.getDesignation()).dateOfJoining(e.getDateOfJoining())
            .salaryGrade(e.getSalaryGrade()).mobile(e.getMobile()).address(e.getAddress())
            .status(e.getStatus()).isHereditary(e.getIsHereditary())
            .dateOfLeaving(e.getDateOfLeaving())
            // Submission Workflow
            .submissionStatus(e.getSubmissionStatus()).submittedAt(e.getSubmittedAt())
            .submittedBy(e.getSubmittedBy()).reviewedAt(e.getReviewedAt())
            .reviewedBy(e.getReviewedBy()).reviewRemarks(e.getReviewRemarks())
            // DC Governance
            .isVerifiedByDc(e.isVerifiedByDc()).verifiedByDcAt(e.getVerifiedByDcAt())
            .verifiedByDcUserId(e.getVerifiedByDcUserId()).dcFlagReason(e.getDcFlagReason())
            // Audit
            .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
            .build();
    }

    // ========== SUBMISSION WORKFLOW (TEMPLE AUTHORITY) ==========

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public EmployeeResponse submitForReview(Long id, SubmitEmployeeRequest request) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        
        // Validate can submit
        if (emp.getSubmissionStatus() != SubmissionStatus.DRAFT) {
            throw new IllegalStateException(
                "Only DRAFT employees can be submitted for review. Current status: " + emp.getSubmissionStatus());
        }
        
        // Update submission fields
        emp.setSubmissionStatus(SubmissionStatus.PENDING_REVIEW);
        emp.setSubmittedAt(LocalDateTime.now());
        emp.setSubmittedBy(currentClaims().userId());
        
        Employee saved = employeeRepository.save(emp);
        
        // Publish notification to DC
        notificationService.notify(
            null, // DC notification - will be handled by notification service
            "Employee Record Submitted",
            "New employee record submitted for review: " + emp.getFullName() + " (" + emp.getEmployeeType() + ")",
            "EMPLOYEE_SUBMISSION",
            saved.getId()
        );
        
        log.info("Employee submitted for review: id=[{}] temple=[{}] by user=[{}]", 
            id, emp.getTempleId(), currentClaims().userId());
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public EmployeeResponse withdrawSubmission(Long id) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        
        // Validate can withdraw
        if (emp.getSubmissionStatus() != SubmissionStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                "Only PENDING_REVIEW employees can be withdrawn. Current status: " + emp.getSubmissionStatus());
        }
        
        // Reset to DRAFT
        emp.setSubmissionStatus(SubmissionStatus.DRAFT);
        emp.setSubmittedAt(null);
        emp.setSubmittedBy(null);
        
        Employee saved = employeeRepository.save(emp);
        
        log.info("Employee submission withdrawn: id=[{}] temple=[{}] by user=[{}]", 
            id, emp.getTempleId(), currentClaims().userId());
        return toResponse(saved);
    }

    // ========== DC REVIEW METHODS ==========

    @Override
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Transactional
    public EmployeeResponse approveEmployee(Long id, ApproveEmployeeRequest request, ScopeHelper.Claims claims) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        
        jurisdictionGuard.assertDistrictScope(temple, claims);
        
        // Validate can approve
        if (emp.getSubmissionStatus() != SubmissionStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                "Only PENDING_REVIEW employees can be approved. Current status: " + emp.getSubmissionStatus());
        }
        
        // Update approval fields
        emp.setSubmissionStatus(SubmissionStatus.APPROVED);
        emp.setReviewedAt(LocalDateTime.now());
        emp.setReviewedBy(claims.userId());
        emp.setReviewRemarks(request.getRemarks());
        
        // Set DC verification flags
        emp.setVerifiedByDc(true);
        emp.setVerifiedByDcAt(LocalDateTime.now());
        emp.setVerifiedByDcUserId(claims.userId());
        emp.setDcFlagReason(null); // Clear any previous flag
        
        Employee saved = employeeRepository.save(emp);
        
        // Notify Temple Authority
        if (emp.getSubmittedBy() != null) {
            notificationService.notify(
                emp.getSubmittedBy(),
                "Employee Record Approved",
                "Your employee record has been approved: " + emp.getFullName() + 
                    (request.getRemarks() != null ? ". Remarks: " + request.getRemarks() : ""),
                "EMPLOYEE_APPROVAL",
                saved.getId()
            );
        }
        
        log.info("Employee approved: id=[{}] temple=[{}] by DC user=[{}]", 
            id, emp.getTempleId(), claims.userId());
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Transactional
    public EmployeeResponse rejectEmployee(Long id, RejectEmployeeRequest request, ScopeHelper.Claims claims) {
        Employee emp = findOrThrow(id);
        Temple temple = templeRepository.findById(emp.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", emp.getTempleId()));
        
        jurisdictionGuard.assertDistrictScope(temple, claims);
        
        // Validate can reject
        if (emp.getSubmissionStatus() != SubmissionStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                "Only PENDING_REVIEW employees can be rejected. Current status: " + emp.getSubmissionStatus());
        }
        
        // Update rejection fields
        emp.setSubmissionStatus(SubmissionStatus.REJECTED);
        emp.setReviewedAt(LocalDateTime.now());
        emp.setReviewedBy(claims.userId());
        emp.setReviewRemarks(request.getReason());
        
        // Set DC flag
        emp.setVerifiedByDc(false);
        emp.setDcFlagReason(request.getReason());
        
        Employee saved = employeeRepository.save(emp);
        
        // Notify Temple Authority
        if (emp.getSubmittedBy() != null) {
            notificationService.notify(
                emp.getSubmittedBy(),
                "Employee Record Rejected",
                "Your employee record has been rejected: " + emp.getFullName() + 
                    ". Reason: " + request.getReason(),
                "EMPLOYEE_REJECTION",
                saved.getId()
            );
        }
        
        log.info("Employee rejected: id=[{}] temple=[{}] by DC user=[{}] reason=[{}]", 
            id, emp.getTempleId(), claims.userId(), request.getReason());
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Transactional(readOnly = true)
    public PaginatedResponse<EmployeeResponse> listPendingReviews(Long districtId, int page, int size) {
        Page<Employee> result = employeeRepository.findPendingReviewsByDistrict(
                districtId, PageRequest.of(page, paginationUtil.clampSize(size)));
        
        log.info("Listed pending employee reviews for district=[{}]: count=[{}]", districtId, result.getTotalElements());
        return PaginatedResponse.of(result.map(this::toResponse));
    }
}
