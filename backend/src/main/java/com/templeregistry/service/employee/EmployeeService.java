package com.templeregistry.service.employee;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.dc.ApproveEmployeeRequest;
import com.templeregistry.dto.request.dc.RejectEmployeeRequest;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.SubmitEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.security.ScopeHelper;

public interface EmployeeService {
    PaginatedResponse<EmployeeResponse> listByTemple(Long templeId, int page, int size);
    EmployeeResponse create(Long templeId, CreateEmployeeRequest request);
    EmployeeResponse getById(Long id);
    EmployeeResponse update(Long id, UpdateEmployeeRequest request);
    void softDelete(Long id);
    
    // Submission Workflow (Temple Authority)
    EmployeeResponse submitForReview(Long id, SubmitEmployeeRequest request);
    EmployeeResponse withdrawSubmission(Long id);
    
    // DC Review Methods
    EmployeeResponse approveEmployee(Long id, ApproveEmployeeRequest request, ScopeHelper.Claims claims);
    EmployeeResponse rejectEmployee(Long id, RejectEmployeeRequest request, ScopeHelper.Claims claims);
    PaginatedResponse<EmployeeResponse> listPendingReviews(Long districtId, int page, int size);
}
