package com.templeregistry.service.impl.observation;

import com.templeregistry.dto.request.observation.CloseObservationRequest;
import com.templeregistry.dto.request.observation.CreateObservationRequest;
import com.templeregistry.dto.response.observation.ObservationResponse;
import com.templeregistry.entity.observation.Observation;
import com.templeregistry.entity.observation.ObservationSeverity;
import com.templeregistry.entity.observation.ObservationStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.observation.ObservationRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.service.audit.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ObservationServiceImplTest {

    @Mock private ObservationRepository observationRepository;
    @Mock private AuditService auditService;
    @Mock private TempleSearchSummaryRepository templeSearchSummaryRepository;

    @InjectMocks
    private ObservationServiceImpl observationService;

    private Observation openObservation;

    @BeforeEach
    void setUp() {
        openObservation = Observation.builder()
                .templeId(1L)
                .entityType("TEMPLE")
                .entityId(1L)
                .title("Test observation")
                .description("A detailed description of the issue")
                .severity(ObservationSeverity.HIGH)
                .status(ObservationStatus.OPEN)
                .raisedByUserId(10L)
                .build();
        openObservation.setId(1L);
    }

    @Test
    void should_createObservation_when_validRequest() {
        CreateObservationRequest rq = new CreateObservationRequest();
        rq.setTempleId(1L);
        rq.setEntityType("TEMPLE");
        rq.setEntityId(1L);
        rq.setTitle("Test observation");
        rq.setDescription("A detailed description of the issue");
        rq.setSeverity("HIGH");

        when(observationRepository.save(any(Observation.class))).thenAnswer(i -> {
            Observation obs = i.getArgument(0);
            obs.setId(1L);
            return obs;
        });

        ObservationResponse response = observationService.create(rq, 10L);

        assertThat(response).isNotNull();
        assertThat(response.getSeverity()).isEqualTo("HIGH");
        assertThat(response.getStatus()).isEqualTo("OPEN");
        verify(auditService).logDataEvent(eq(10L), eq("AUDITOR"), eq("CREATE_OBSERVATION"), eq("OBSERVATION"), eq(1L), anyString());
    }

    @Test
    void should_throwException_when_createObservationWithInvalidSeverity() {
        CreateObservationRequest rq = new CreateObservationRequest();
        rq.setTempleId(1L); rq.setEntityType("TEMPLE"); rq.setEntityId(1L);
        rq.setTitle("Test"); rq.setDescription("Description"); rq.setSeverity("INVALID_SEVERITY");

        assertThatThrownBy(() -> observationService.create(rq, 10L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void should_closeObservation_when_openObservationExists() {
        when(observationRepository.findById(1L)).thenReturn(Optional.of(openObservation));
        when(observationRepository.save(any(Observation.class))).thenAnswer(i -> i.getArgument(0));

        CloseObservationRequest closeRq = new CloseObservationRequest();
        closeRq.setResolutionNote("Issue resolved after investigation.");

        ObservationResponse response = observationService.closeObservation(1L, closeRq);

        assertThat(response.getStatus()).isEqualTo("CLOSED");
        assertThat(response.getResolutionNote()).isEqualTo("Issue resolved after investigation.");
    }

    @Test
    void should_throwException_when_closingAlreadyClosedObservation() {
        openObservation.setStatus(ObservationStatus.CLOSED);
        when(observationRepository.findById(1L)).thenReturn(Optional.of(openObservation));

        CloseObservationRequest closeRq = new CloseObservationRequest();
        closeRq.setResolutionNote("Duplicate close attempt.");

        assertThatThrownBy(() -> observationService.closeObservation(1L, closeRq))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already CLOSED");
    }

    @Test
    void should_assignObservation_when_observationIsOpen() {
        when(observationRepository.findById(1L)).thenReturn(Optional.of(openObservation));
        when(observationRepository.save(any(Observation.class))).thenAnswer(i -> i.getArgument(0));

        ObservationResponse response = observationService.assignObservation(1L, 99L);

        assertThat(response.getStatus()).isEqualTo("ASSIGNED");
        assertThat(response.getAssignedToUserId()).isEqualTo(99L);
    }

    @Test
    void should_throwException_when_assigningNonOpenObservation() {
        openObservation.setStatus(ObservationStatus.ASSIGNED);
        when(observationRepository.findById(1L)).thenReturn(Optional.of(openObservation));

        assertThatThrownBy(() -> observationService.assignObservation(1L, 99L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only OPEN");
    }

    @Test
    void should_throwEntityNotFoundException_when_observationNotFound() {
        when(observationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> observationService.getById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
