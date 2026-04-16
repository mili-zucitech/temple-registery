package com.templeregistry.service.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.*;
import com.templeregistry.dto.response.temple.*;

public interface TempleService {

    PaginatedResponse<TempleSearchResultResponse> search(TempleSearchFilterRequest filter);

    TempleResponse create(CreateTempleRequest request);

    TempleResponse getById(Long id);

    TempleResponse update(Long id, UpdateTempleRequest request);
}
