package com.templeregistry.repository.employee;

import com.templeregistry.entity.employee.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Page<Employee> findAllByTempleId(Long templeId, Pageable pageable);
    List<Employee> findAllByTempleId(Long templeId);
}
