package com.templeregistry.service.employee;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;

public interface EmployeeService {
    PaginatedResponse<EmployeeResponse> listByTemple(Long templeId, int page, int size);
    EmployeeResponse create(Long templeId, CreateEmployeeRequest request);
    EmployeeResponse getById(Long id);
    EmployeeResponse update(Long id, UpdateEmployeeRequest request);
    void softDelete(Long id);
}
