package com.templeregistry.entity.employee;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "employees", indexes = {
        @Index(name = "idx_employees_temple_id", columnList = "temple_id"),
        @Index(name = "idx_employees_status",    columnList = "status")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE employees SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Employee extends BaseEntity {

    @Column(name = "temple_id", nullable = false) private Long templeId;
    @Column(name = "employee_ref", length = 50) private String employeeRef;
    @Column(name = "full_name", nullable = false, length = 200) private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false, length = 30) private EmployeeType employeeType;

    @Column(name = "designation", length = 150) private String designation;
    @Column(name = "date_of_joining") private LocalDate dateOfJoining;
    @Column(name = "salary_grade", length = 50) private String salaryGrade;
    @Column(name = "mobile", length = 15) private String mobile;
    @Column(name = "address", columnDefinition = "TEXT") private String address;
    @Column(name = "is_hereditary") private boolean isHereditary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20) private EmployeeStatus status = EmployeeStatus.ACTIVE;
}
