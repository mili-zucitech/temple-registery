package com.templeregistry.dto.response.geo;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class TalukResponse { private Long id; private Long districtId; private String name; }
