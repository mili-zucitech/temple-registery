package com.templeregistry.dto.response.employee;

import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.EmployeeType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter @Builder
public class EmployeeResponse {
    private Long id; private Long templeId; private String fullName;
    private EmployeeType employeeType; private String designation;
    private LocalDate dateOfJoining; private String salaryGrade;
    private EmployeeStatus status; private boolean isHereditary;
}
