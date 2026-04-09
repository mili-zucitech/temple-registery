package com.templeregistry.dto.response.geo;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class CityResponse { private Long id; private Long stateId; private String name; }
