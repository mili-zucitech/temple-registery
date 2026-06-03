package com.templeregistry.dto.request.employee;

import com.templeregistry.entity.employee.EmployeeType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter @NoArgsConstructor
public class CreateEmployeeRequest {
    @NotBlank @Size(max = 200) private String fullName;
    @NotNull private EmployeeType employeeType;
    @Size(max = 50) private String employeeRef;
    @Size(max = 150) private String designation;
    private LocalDate dateOfJoining;
    @Size(max = 50) private String salaryGrade;
    @Size(max = 15) private String mobile;
    private String address;
    private boolean hereditary;
}
