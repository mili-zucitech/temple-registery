package com.templeregistry.dto.response.declaration;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Base response DTO for declaration asset items.
 */
@Getter
@Setter
@NoArgsConstructor
public abstract class AssetItemResponse {
    private Long id;
}
