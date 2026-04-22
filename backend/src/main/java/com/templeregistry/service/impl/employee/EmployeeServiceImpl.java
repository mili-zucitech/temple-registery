package com.templeregistry.service.impl.employee;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.employee.EmployeeService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final AuditService auditService;

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
                .status(EmployeeStatus.ACTIVE).build();
        Employee saved = employeeRepository.save(emp);
        auditService.logDataEvent(currentUserId(), currentRole(), "CREATE", "Employee", saved.getId(),
                "Employee created for templeId=" + templeId);
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

        Employee saved = employeeRepository.save(emp);
        auditService.logDataEvent(currentUserId(), currentRole(), "UPDATE", "Employee", id,
                "Employee updated: status=" + saved.getStatus());
        log.info("Employee updated: id=[{}] newStatus=[{}]", id, saved.getStatus());
        return toResponse(saved);
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
        auditService.logDataEvent(currentUserId(), currentRole(), "DELETE", "Employee", id,
                "Employee soft-deleted");
        log.info("Employee soft-deleted: id=[{}]", id);
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.userId();
        return 0L;
    }

    private String currentRole() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.role();
        return "UNKNOWN";
    }

    private Employee findOrThrow(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Employee", id));
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
            .id(e.getId()).templeId(e.getTempleId()).employeeRef(e.getEmployeeRef())
            .fullName(e.getFullName()).employeeType(e.getEmployeeType())
            .designation(e.getDesignation()).dateOfJoining(e.getDateOfJoining())
            .salaryGrade(e.getSalaryGrade()).mobile(e.getMobile()).address(e.getAddress())
            .status(e.getStatus()).isHereditary(e.getIsHereditary())
            .build();
    }
}
