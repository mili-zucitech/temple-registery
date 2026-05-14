package com.templeregistry.dto.request.employee;

import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.EmployeeType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request body for updating an existing employee record.
 * status and dateOfLeaving support status transitions.
 * dateOfLeaving is required (validated at service layer) when status is RETIRED or RESIGNED (VAL-015).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateEmployeeRequest {

    @Size(max = 200)
    private String fullName;

    private EmployeeType employeeType;

    @Size(max = 150)
    private String designation;

    @Size(max = 50)
    private String salaryGrade;

    /** New status for the employee. Triggers terminal-state guard if RETIRED or RESIGNED. */
    private EmployeeStatus status;

    /** Required when status is RETIRED or RESIGNED (VAL-015). */
    private LocalDate dateOfLeaving;
}
