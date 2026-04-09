package com.templeregistry.service.impl.employee;

import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock EmployeeRepository employeeRepository;
    @Mock OwnershipGuard ownershipGuard;
    @Mock PaginationUtil paginationUtil;

    @InjectMocks EmployeeServiceImpl employeeService;

    private Employee resignedEmployee;
    private Employee activeEmployee;

    @BeforeEach
    void setUp() {
        resignedEmployee = Employee.builder()
                .templeId(1L).fullName("Rama Dasa").status(EmployeeStatus.RESIGNED).build();

        activeEmployee = Employee.builder()
                .templeId(1L).fullName("Krishna Dasa").status(EmployeeStatus.ACTIVE).build();

        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(any());
    }

    /* ── VAL-012: Terminal status guard ─────────────────────────────── */

    @Test
    void should_throw_IllegalStatusTransition_when_RESIGNED_employee_set_to_ACTIVE() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(resignedEmployee));

        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                .status(EmployeeStatus.ACTIVE).build();

        assertThatThrownBy(() -> employeeService.update(1L, rq))
                .isInstanceOf(IllegalStatusTransitionException.class)
                .hasMessageContaining("TRM-EMP-TERMINAL");
    }

    @Test
    void should_throw_IllegalStatusTransition_when_RETIRED_employee_set_to_ACTIVE() {
        Employee retiredEmployee = Employee.builder()
                .templeId(1L).fullName("Govinda Dasa").status(EmployeeStatus.RETIRED).build();
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(retiredEmployee));

        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                .status(EmployeeStatus.ACTIVE).build();

        assertThatThrownBy(() -> employeeService.update(2L, rq))
                .isInstanceOf(IllegalStatusTransitionException.class)
                .hasMessageContaining("TRM-EMP-TERMINAL");
    }

    /* ── VAL-015: dateOfLeaving required for terminal status ────────── */

    @Test
    void should_throw_when_transitioning_to_RESIGNED_without_dateOfLeaving() {
        when(employeeRepository.findById(3L)).thenReturn(Optional.of(activeEmployee));

        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                .status(EmployeeStatus.RESIGNED)
                .dateOfLeaving(null)
                .build();

        assertThatThrownBy(() -> employeeService.update(3L, rq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("VAL-015");
    }

    @Test
    void should_throw_when_transitioning_to_RETIRED_without_dateOfLeaving() {
        when(employeeRepository.findById(4L)).thenReturn(Optional.of(activeEmployee));

        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                .status(EmployeeStatus.RETIRED)
                .dateOfLeaving(null)
                .build();

        assertThatThrownBy(() -> employeeService.update(4L, rq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("VAL-015");
    }

    @Test
    void should_update_employee_and_set_dateOfLeaving_when_transitioning_to_RESIGNED() {
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(activeEmployee));
        when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LocalDate leavingDate = LocalDate.of(2024, 3, 31);
        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                .status(EmployeeStatus.RESIGNED)
                .dateOfLeaving(leavingDate)
                .build();

        employeeService.update(5L, rq);

        assertThat(activeEmployee.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
        assertThat(activeEmployee.getDateOfLeaving()).isEqualTo(leavingDate);
    }

    /* ── ON_LEAVE is reversible (not terminal) ───────────────────────── */

    @Test
    void should_allow_ON_LEAVE_to_ACTIVE_transition() {
        Employee onLeaveEmployee = Employee.builder()
                .templeId(1L).fullName("Mukunda Dasa").status(EmployeeStatus.ON_LEAVE).build();
        when(employeeRepository.findById(6L)).thenReturn(Optional.of(onLeaveEmployee));
        when(employeeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder()
                .status(EmployeeStatus.ACTIVE).build();

        assertThatNoException().isThrownBy(() -> employeeService.update(6L, rq));
        assertThat(onLeaveEmployee.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
    }

    /* ── EntityNotFoundException ────────────────────────────────────── */

    @Test
    void should_throw_EntityNotFoundException_when_employee_not_found() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateEmployeeRequest rq = UpdateEmployeeRequest.builder().fullName("Ghost").build();

        assertThatThrownBy(() -> employeeService.update(99L, rq))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
