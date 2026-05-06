package com.templeregistry.service.admin;

import com.templeregistry.dto.request.admin.UpdateSystemConfigRequest;
import com.templeregistry.dto.response.admin.SystemConfigResponse;

import java.util.List;

public interface SystemConfigService {

    List<SystemConfigResponse> listAll(String category);

    SystemConfigResponse getByKey(String key);

    SystemConfigResponse update(String key, UpdateSystemConfigRequest request, Long actorUserId);
}
