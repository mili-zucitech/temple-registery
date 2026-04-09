package com.templeregistry.dto.response.geo;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class StateResponse { private Long id; private String name; private String code; }
