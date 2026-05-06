package com.templeregistry.service.observation;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.observation.CloseObservationRequest;
import com.templeregistry.dto.request.observation.CreateObservationRequest;
import com.templeregistry.dto.response.observation.ObservationResponse;

public interface ObservationService {

    ObservationResponse create(CreateObservationRequest request, Long actorUserId);

    ObservationResponse getById(Long id);

    PaginatedResponse<ObservationResponse> listAll(int page, int size);

    PaginatedResponse<ObservationResponse> listByTemple(Long templeId, int page, int size);

    PaginatedResponse<ObservationResponse> listByStatus(String status, int page, int size);

    ObservationResponse assignObservation(Long id, Long assignedToUserId);

    ObservationResponse closeObservation(Long id, CloseObservationRequest request);
}
