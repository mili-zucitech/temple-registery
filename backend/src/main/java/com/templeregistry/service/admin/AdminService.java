package com.templeregistry.service.admin;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.admin.CreateUserRequest;
import com.templeregistry.dto.request.admin.UpdateUserRequest;
import com.templeregistry.dto.response.admin.UserAdminResponse;

public interface AdminService {

    PaginatedResponse<UserAdminResponse> listUsers(int page, int size);

    UserAdminResponse getUserById(Long id);

    UserAdminResponse createUser(CreateUserRequest request);

    UserAdminResponse updateUser(Long id, UpdateUserRequest request);

    void deactivateUser(Long id);

    void activateUser(Long id);

    void rebuildSearchSummary();

    void refreshTempleSearchSummary(Long templeId);
}
