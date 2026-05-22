package com.templeregistry.util;

import com.templeregistry.entity.dc.AcknowledgementSequence;
import com.templeregistry.exception.AcknowledgementNumberConflictException;
import com.templeregistry.repository.dc.AcknowledgementSequenceRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcknowledgementNumberGeneratorTest {

    @Mock
    AcknowledgementSequenceRepository sequenceRepository;

    @InjectMocks
    AcknowledgementNumberGenerator generator;

    // ─── generate ─────────────────────────────────────────────────────────────

    @Nested
    class Generate {

        @Test
        void should_generateAckNumber_when_sequenceRepositoryReturnsValidSeqId() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(42L)
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            String result = generator.generate();

            assertThat(result).startsWith("TRM/ACK/");
            assertThat(result).endsWith("000042");
        }

        @Test
        void should_formatSeqIdAs6Digits_when_seqIdIsSmall() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(1L)
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            String result = generator.generate();

            assertThat(result).endsWith("/000001");
        }

        @Test
        void should_formatSeqIdAs6Digits_when_seqIdIsLarge() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(999999L)
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            String result = generator.generate();

            assertThat(result).endsWith("/999999");
        }

        @Test
        void should_includeFinancialYear_when_sequenceGenerated() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(100L)
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            String result = generator.generate();

            // Format: TRM/ACK/YYYY-YY/NNNNNN
            assertThat(result).matches("TRM/ACK/\\d{4}-\\d{2}/\\d{6}");
        }

        @Test
        void should_persistSequenceWithCurrentFinancialYear_when_generateCalled() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(10L)
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            generator.generate();

            ArgumentCaptor<AcknowledgementSequence> captor = ArgumentCaptor.forClass(AcknowledgementSequence.class);
            verify(sequenceRepository).save(captor.capture());
            // The saved sequence must have a non-null financial year
            assertThat(captor.getValue().getFinancialYear()).isNotNull().matches("\\d{4}-\\d{2}");
        }

        @Test
        void should_throwAcknowledgementNumberConflictException_when_seqIdIsZero() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(0L)  // S2 guard: zero = INSERT silently failed
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            assertThatThrownBy(() -> generator.generate())
                .isInstanceOf(AcknowledgementNumberConflictException.class);
        }

        @Test
        void should_throwAcknowledgementNumberConflictException_when_seqIdIsNull() {
            AcknowledgementSequence seq = AcknowledgementSequence.builder()
                .seqId(null)  // S2 guard: null = INSERT did not return
                .build();
            when(sequenceRepository.save(any())).thenReturn(seq);

            assertThatThrownBy(() -> generator.generate())
                .isInstanceOf(AcknowledgementNumberConflictException.class);
        }
    }
}
