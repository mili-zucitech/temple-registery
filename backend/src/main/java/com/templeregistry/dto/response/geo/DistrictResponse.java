package com.templeregistry.dto.response.geo;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class DistrictResponse { private Long id; private Long cityId; private String name; private String code; }
