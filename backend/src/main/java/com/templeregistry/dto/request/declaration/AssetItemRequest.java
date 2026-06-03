package com.templeregistry.dto.request.declaration;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Base request DTO for declaration asset line items.
 * The parent declaration ID is derived from the route/service context.
 */
@Getter
@Setter
@NoArgsConstructor
public abstract class AssetItemRequest {

    /** Optional line-item ID used when editing an existing draft. */
    private Long id;
}
