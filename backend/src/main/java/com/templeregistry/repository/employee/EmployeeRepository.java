package com.templeregistry.repository.employee;

import com.templeregistry.entity.employee.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Page<Employee> findAllByTempleId(Long templeId, Pageable pageable);
    List<Employee> findAllByTempleId(Long templeId);

    // Find pending reviews for a district (joins with Temple table — submitted employees have submittedAt set)
    @Query("SELECT e FROM Employee e JOIN Temple t ON e.templeId = t.id " +
           "WHERE e.submittedAt IS NOT NULL AND e.reviewedAt IS NULL AND t.districtId = :districtId " +
           "ORDER BY e.submittedAt DESC")
    Page<Employee> findPendingReviewsByDistrict(@Param("districtId") Long districtId, Pageable pageable);
}
