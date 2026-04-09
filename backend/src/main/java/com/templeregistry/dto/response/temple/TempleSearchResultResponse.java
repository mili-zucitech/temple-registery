package com.templeregistry.dto.response.temple;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TempleSearchResultResponse {
    private Long id;
    private String registrationNumber;
    private String name;
    private String grade;
    private String primaryDeity;
    private String tradition;
    private Long districtId;
    private boolean trustRegistered;
    private String assetDeclarationStatus;
    private String photoUrl;
}
