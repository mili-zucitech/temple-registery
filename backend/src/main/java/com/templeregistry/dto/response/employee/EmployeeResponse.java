package com.templeregistry.dto.response.employee;

import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.EmployeeType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

/**
 * Employee response DTO.
 * No DC approval workflow applies to Staff — changes are effective immediately.
 * No verification/compliance fields are exposed.
 */
@Getter @Builder
public class EmployeeResponse {
    private Long id;
    private Long templeId;
    private String employeeRef;
    private String fullName;
    private EmployeeType employeeType;
    private String designation;
    private LocalDate dateOfJoining;
    private String salaryGrade;
    private String mobile;
    private String address;
    private EmployeeStatus status;
    private Boolean isHereditary;
}
