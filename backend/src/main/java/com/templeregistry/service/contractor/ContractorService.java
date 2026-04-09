package com.templeregistry.service.contractor;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.contractor.CreateContractorRequest;
import com.templeregistry.dto.response.contractor.ContractorResponse;

public interface ContractorService {
    PaginatedResponse<ContractorResponse> listByTemple(Long templeId, int page, int size);
    ContractorResponse create(Long templeId, CreateContractorRequest request);
    ContractorResponse getById(Long id);
    ContractorResponse update(Long id, CreateContractorRequest request);
    void softDelete(Long id);
}
