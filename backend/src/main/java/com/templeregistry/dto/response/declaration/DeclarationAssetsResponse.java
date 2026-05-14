package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.util.List;

/**
 * Wrapper response containing all asset items for a declaration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeclarationAssetsResponse {
    private Long declarationId;
    private List<AgriLandItemResponse> agriculturalLand;
    private List<BuildingItemResponse> buildings;
    private List<LeasedPropertyItemResponse> leasedProperties;
    private List<PreciousMetalItemResponse> preciousMetals;
    private List<ArtifactItemResponse> artifacts;
    private List<VehicleItemResponse> vehicles;
    private List<EquipmentItemResponse> equipment;
    private List<FinancialAssetItemResponse> financialAssets;
}
