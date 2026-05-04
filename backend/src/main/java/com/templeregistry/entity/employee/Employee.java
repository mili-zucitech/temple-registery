package com.templeregistry.entity.employee;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.entity.governance.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees", indexes = {
        @Index(name = "idx_employees_temple_id", columnList = "temple_id"),
        @Index(name = "idx_employees_status", columnList = "status"),
        @Index(name = "idx_employees_employee_ref", columnList = "employee_ref"),
        @Index(name = "idx_employees_employee_type", columnList = "employee_type"),
        @Index(name = "idx_employees_verified", columnList = "is_verified_by_dc")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_employees_temple_ref", columnNames = {"temple_id", "employee_ref"})
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE employees SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class Employee extends BaseEntity {

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    @Column(name = "employee_ref", length = 50)
    private String employeeRef;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false, length = 30)
    private EmployeeType employeeType;

    @Column(name = "designation", length = 150)
    private String designation;

    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;

    @Column(name = "salary_grade", length = 50)
    private String salaryGrade;

    @Column(name = "mobile", length = 15)
    private String mobile;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Builder.Default
    @Column(name = "is_hereditary", nullable = false)
    private Boolean hereditary = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Column(name = "date_of_leaving")
    private LocalDate dateOfLeaving;

    // Submission Workflow Fields
    // NOTE: submission_status column was dropped from employees table by V36 migration.
    // This field is kept as @Transient for in-memory workflow tracking only.
    @Transient
    @Builder.Default
    private SubmissionStatus submissionStatus = SubmissionStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "submitted_by")
    private Long submittedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "review_remarks", columnDefinition = "TEXT")
    private String reviewRemarks;

    // DC Governance Fields
    @Builder.Default
    @Column(name = "is_verified_by_dc", nullable = false)
    private boolean verifiedByDc = false;

    @Column(name = "verified_by_dc_at")
    private LocalDateTime verifiedByDcAt;

    @Column(name = "verified_by_dc_user_id")
    private Long verifiedByDcUserId;

    @Column(name = "dc_flag_reason", columnDefinition = "TEXT")
    private String dcFlagReason;
}
