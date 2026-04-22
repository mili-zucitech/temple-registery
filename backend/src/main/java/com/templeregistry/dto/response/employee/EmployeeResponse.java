package com.templeregistry.dto.response.employee;

import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.EmployeeType;
import com.templeregistry.entity.employee.SubmissionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
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
    private LocalDate dateOfLeaving;
    
    // Submission Workflow
    private SubmissionStatus submissionStatus;
    private LocalDateTime submittedAt;
    private Long submittedBy;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private String reviewRemarks;
    
    // DC Governance
    private boolean isVerifiedByDc;
    private LocalDateTime verifiedByDcAt;
    private Long verifiedByDcUserId;
    private String dcFlagReason;
    
    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
