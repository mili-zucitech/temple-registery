package com.templeregistry.dto.request.temple;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TempleSearchFilterRequest {

    private Long districtId;
    private Long talukId;
    private Long hobliId;
    private List<String> grade;          // ["A","B","C"]
    private String keyword;              // partial match on name
    private String deityName;
    private String tradition;
    private Boolean trustRegistered;
    private String declarationStatus;    // PENDING, APPROVED, OVERDUE
    private Integer establishedYearFrom;
    private Integer establishedYearTo;

    // Pagination
    @Builder.Default private Integer page = 0;
    @Builder.Default private Integer size = 10;
    @Builder.Default private String sort = "name,asc";
}
