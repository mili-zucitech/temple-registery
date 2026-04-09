package com.templeregistry.service.impl.employee;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.employee.EmployeeService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final OwnershipGuard ownershipGuard;
    private final PaginationUtil paginationUtil;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<EmployeeResponse> listByTemple(Long templeId, int page, int size) {
        ownershipGuard.assertOwnsTemple(templeId);
        Page<Employee> result = employeeRepository.findAllByTempleId(
                templeId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public EmployeeResponse create(Long templeId, CreateEmployeeRequest rq) {
        ownershipGuard.assertOwnsTemple(templeId);
        Employee emp = Employee.builder()
                .templeId(templeId).fullName(rq.getFullName()).employeeType(rq.getEmployeeType())
                .employeeRef(rq.getEmployeeRef()).designation(rq.getDesignation())
                .dateOfJoining(rq.getDateOfJoining()).salaryGrade(rq.getSalaryGrade())
                .mobile(rq.getMobile()).address(rq.getAddress()).isHereditary(rq.isHereditary())
                .status(EmployeeStatus.ACTIVE).build();
        Employee saved = employeeRepository.save(emp);
        log.info("Employee created: id=[{}] temple=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public EmployeeResponse getById(Long id) {
        Employee emp = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        return toResponse(emp);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public EmployeeResponse update(Long id, CreateEmployeeRequest rq) {
        Employee emp = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        emp.setFullName(rq.getFullName()); emp.setEmployeeType(rq.getEmployeeType());
        emp.setDesignation(rq.getDesignation()); emp.setSalaryGrade(rq.getSalaryGrade());
        return toResponse(employeeRepository.save(emp));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void softDelete(Long id) {
        Employee emp = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(emp.getTempleId());
        employeeRepository.deleteById(id); // @SQLDelete intercepts to UPDATE
        log.info("Employee soft-deleted: id=[{}]", id);
    }

    private Employee findOrThrow(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Employee", id));
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId()).templeId(e.getTempleId()).fullName(e.getFullName())
                .employeeType(e.getEmployeeType()).designation(e.getDesignation())
                .dateOfJoining(e.getDateOfJoining()).salaryGrade(e.getSalaryGrade())
                .status(e.getStatus()).isHereditary(e.isHereditary()).build();
    }
}
