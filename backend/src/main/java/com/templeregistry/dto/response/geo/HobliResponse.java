package com.templeregistry.dto.response.geo;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class HobliResponse { private Long id; private Long talukId; private String name; }
