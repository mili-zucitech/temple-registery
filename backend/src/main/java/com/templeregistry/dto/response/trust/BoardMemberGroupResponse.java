package com.templeregistry.dto.response.trust;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BoardMemberGroupResponse {
    private List<BoardMemberResponse> current;
    private List<BoardMemberResponse> past;
}
