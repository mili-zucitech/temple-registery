package com.templeregistry.service.accesscontrol;

import com.templeregistry.dto.request.accesscontrol.CreateFieldMaskRequest;
import com.templeregistry.dto.request.accesscontrol.CreatePolicyRequest;
import com.templeregistry.dto.request.accesscontrol.UpdatePolicyRequest;
import com.templeregistry.dto.response.accesscontrol.FieldMaskResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyMatrixResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * SUPER_ADMIN facing service for managing DACVM policies and field masks.
 */
public interface PolicyManagementService {

    Page<PolicyResponse> listPolicies(Pageable pageable);

    PolicyResponse createPolicy(CreatePolicyRequest request);

    PolicyResponse updatePolicy(Long id, UpdatePolicyRequest request);

    void deletePolicy(Long id);

    List<PolicyResponse> batchUpsertPolicies(List<CreatePolicyRequest> requests);

    PolicyMatrixResponse getPolicyMatrix();

    Page<FieldMaskResponse> listFieldMasks(Pageable pageable);

    FieldMaskResponse createOrUpdateFieldMask(CreateFieldMaskRequest request);

    void deleteFieldMask(Long id);
}
