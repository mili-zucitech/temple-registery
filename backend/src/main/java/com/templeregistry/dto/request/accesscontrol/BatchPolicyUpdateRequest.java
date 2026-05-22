package com.templeregistry.dto.request.accesscontrol;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BatchPolicyUpdateRequest {

    @NotEmpty(message = "updates must not be empty")
    @Valid
    private List<BatchPolicyItem> updates;

    @Data
    public static class BatchPolicyItem {
        /** If id is provided, update existing policy. If null, create new. */
        private Long id;

        @Valid
        private CreatePolicyRequest policy;
    }
}
