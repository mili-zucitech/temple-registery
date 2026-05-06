package com.templeregistry.service.impl.observation;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.observation.CloseObservationRequest;
import com.templeregistry.dto.request.observation.CreateObservationRequest;
import com.templeregistry.dto.response.observation.ObservationResponse;
import com.templeregistry.entity.observation.Observation;
import com.templeregistry.entity.observation.ObservationSeverity;
import com.templeregistry.entity.observation.ObservationStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.observation.ObservationRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.observation.ObservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ObservationServiceImpl implements ObservationService {

    private final ObservationRepository observationRepository;
    private final AuditService auditService;
    private final TempleSearchSummaryRepository templeSearchSummaryRepository;

    @Override
    @PreAuthorize(RoleConstants.AUDITOR_ONLY)
    @Transactional
    public ObservationResponse create(CreateObservationRequest request, Long actorUserId) {
        ObservationSeverity severity = ObservationSeverity.valueOf(request.getSeverity().toUpperCase());

        Observation obs = Observation.builder()
                .templeId(request.getTempleId())
                .entityType(request.getEntityType().toUpperCase())
                .entityId(request.getEntityId())
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(severity)
                .status(ObservationStatus.OPEN)
                .raisedByUserId(actorUserId)
                .build();
        Observation saved = observationRepository.save(obs);
        auditService.logDataEvent(actorUserId, "AUDITOR", "CREATE_OBSERVATION", "OBSERVATION", saved.getId(),
                "severity=" + severity + " temple=" + request.getTempleId());
        log.info("Observation [{}] created by userId={} severity={}", saved.getId(), actorUserId, severity);
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Transactional(readOnly = true)
    public ObservationResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Transactional(readOnly = true)
    public PaginatedResponse<ObservationResponse> listAll(int page, int size) {
        Page<ObservationResponse> result = observationRepository
                .findAllByDeletedFalse(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
        return PaginatedResponse.of(result);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Transactional(readOnly = true)
    public PaginatedResponse<ObservationResponse> listByTemple(Long templeId, int page, int size) {
        Page<ObservationResponse> result = observationRepository
                .findAllByTempleIdAndDeletedFalse(templeId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
        return PaginatedResponse.of(result);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Transactional(readOnly = true)
    public PaginatedResponse<ObservationResponse> listByStatus(String status, int page, int size) {
        ObservationStatus obsStatus = ObservationStatus.valueOf(status.toUpperCase());
        Page<ObservationResponse> result = observationRepository
                .findAllByStatusAndDeletedFalse(obsStatus, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
        return PaginatedResponse.of(result);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public ObservationResponse assignObservation(Long id, Long assignedToUserId) {
        Observation obs = findOrThrow(id);
        if (obs.getStatus() != ObservationStatus.OPEN) {
            throw new IllegalStateException("Only OPEN observations can be assigned.");
        }
        obs.setAssignedToUserId(assignedToUserId);
        obs.setStatus(ObservationStatus.ASSIGNED);
        return toResponse(observationRepository.save(obs));
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public ObservationResponse closeObservation(Long id, CloseObservationRequest request) {
        Observation obs = findOrThrow(id);
        if (obs.getStatus() == ObservationStatus.CLOSED) {
            throw new IllegalStateException("Observation is already CLOSED.");
        }
        obs.setStatus(ObservationStatus.CLOSED);
        obs.setResolutionNote(request.getResolutionNote());
        obs.setClosedAt(LocalDateTime.now());
        return toResponse(observationRepository.save(obs));
    }

    private Observation findOrThrow(Long id) {
        return observationRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Observation", id));
    }

    private ObservationResponse toResponse(Observation o) {
        String templeName = templeSearchSummaryRepository.findByTempleId(o.getTempleId())
                .map(tss -> tss.getName())
                .orElse(null);
        return ObservationResponse.builder()
                .id(o.getId())
                .templeId(o.getTempleId())
                .templeName(templeName)
                .entityType(o.getEntityType())
                .entityId(o.getEntityId())
                .title(o.getTitle())
                .description(o.getDescription())
                .severity(o.getSeverity().name())
                .status(o.getStatus().name())
                .raisedByUserId(o.getRaisedByUserId())
                .assignedToUserId(o.getAssignedToUserId())
                .evidenceDocumentIds(o.getEvidenceDocumentIds())
                .resolutionNote(o.getResolutionNote())
                .closedAt(o.getClosedAt())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
