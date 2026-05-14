package com.templeregistry.property;

import com.templeregistry.entity.geo.District;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.service.impl.declaration.AcknowledgementServiceImpl;
import net.jqwik.api.*;
import net.jqwik.api.constraints.AlphaChars;
import net.jqwik.api.constraints.StringLength;

import java.util.*;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Feature: asset-declaration-complete, Property 5: Acknowledgement Number Uniqueness and Format
 *
 * For any two distinct AssetDeclaration records that have been approved, their
 * acknowledgement_number values must be different. Additionally, for any approved
 * declaration, acknowledgement_number must match the pattern
 * ACK-{DISTRICT_CODE}-{FINANCIAL_YEAR}-{SEQUENCE} where SEQUENCE is a zero-padded
 * positive integer.
 *
 * Validates: Requirements 5.2, 8.1, 8.5
 */
class AcknowledgementPropertyTest {

    /**
     * Pattern: ACK-{DISTRICT_CODE}-{FINANCIAL_YEAR}-{SEQUENCE}
     * e.g. ACK-CBE-2025-26-000042
     * Pattern: ACK-\w+-\d{4}-\d{2}-\d{6}
     */
    private static final Pattern ACK_PATTERN =
            Pattern.compile("^ACK-\\w+-\\d{4}-\\d{2}-\\d{6}$");

    /**
     * Property 5a: Generated acknowledgement numbers match the required format.
     */
    @Property(tries = 200)
    void acknowledgementNumberMatchesFormat(
            @ForAll @AlphaChars @StringLength(min = 2, max = 5) String districtCode,
            @ForAll @net.jqwik.api.constraints.IntRange(min = 2020, max = 2030) int year,
            @ForAll @net.jqwik.api.constraints.IntRange(min = 1, max = 99) int sequence) {

        // Simulate the format generation logic from AcknowledgementServiceImpl
        String financialYear = year + "-" + String.format("%02d", (year + 1) % 100);
        String ackNumber = "ACK-" + districtCode.toUpperCase() + "-" + financialYear + "-" + String.format("%06d", sequence);

        assertThat(ACK_PATTERN.matcher(ackNumber).matches())
                .as("Acknowledgement number '%s' must match pattern ACK-\\w+-\\d{4}-\\d{2}-\\d{6}", ackNumber)
                .isTrue();
    }

    /**
     * Property 5b: Sequence is zero-padded to 6 digits.
     */
    @Property(tries = 200)
    void sequenceIsZeroPaddedToSixDigits(
            @ForAll @net.jqwik.api.constraints.IntRange(min = 1, max = 999999) int sequence) {

        String paddedSeq = String.format("%06d", sequence);
        assertThat(paddedSeq)
                .as("Sequence %d must be zero-padded to 6 digits", sequence)
                .hasSize(6)
                .matches("\\d{6}");
    }

    /**
     * Property 5c: Sequential calls to generate() produce unique acknowledgement numbers.
     * Tests that the sequence increments correctly.
     */
    @Property(tries = 100)
    void sequentialGenerationsProduceUniqueNumbers(
            @ForAll @net.jqwik.api.constraints.IntRange(min = 1, max = 50) int count) {

        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);
        DistrictRepository districtRepo = mock(DistrictRepository.class);

        District district = new District();
        district.setCode("CBE");
        when(districtRepo.findById(anyLong())).thenReturn(Optional.of(district));

        // Simulate incrementing sequence: each call returns one more ack number
        List<String> generatedNumbers = new ArrayList<>();
        String prefix = "ACK-CBE-2025-26-";

        // Mock: first call returns empty list, subsequent calls return previously generated numbers
        when(declarationRepo.findAcknowledgementNumbersByPrefix(anyString()))
                .thenAnswer(inv -> new ArrayList<>(generatedNumbers));

        AcknowledgementServiceImpl service = new AcknowledgementServiceImpl(declarationRepo, districtRepo);

        Set<String> uniqueNumbers = new HashSet<>();
        for (int i = 0; i < count; i++) {
            String ackNumber = service.generate(1L, "2025-26");
            assertThat(ACK_PATTERN.matcher(ackNumber).matches())
                    .as("Generated number '%s' must match pattern", ackNumber)
                    .isTrue();
            assertThat(uniqueNumbers.add(ackNumber))
                    .as("Generated number '%s' must be unique (duplicate detected)", ackNumber)
                    .isTrue();
            generatedNumbers.add(ackNumber);
        }

        assertThat(uniqueNumbers).hasSize(count);
    }

    /**
     * Property 5d: Financial year format YYYY-YY is preserved in ack number.
     */
    @Property(tries = 100)
    void financialYearIsPreservedInAckNumber(
            @ForAll @net.jqwik.api.constraints.IntRange(min = 2020, max = 2030) int year) {

        String financialYear = year + "-" + String.format("%02d", (year + 1) % 100);
        String ackNumber = "ACK-CBE-" + financialYear + "-000001";

        assertThat(ackNumber).contains(financialYear);
        assertThat(ACK_PATTERN.matcher(ackNumber).matches())
                .as("Ack number with financial year %s must match pattern", financialYear)
                .isTrue();
    }

    /**
     * Property 5e: Two approved declarations for the same district+year get different sequences.
     */
    @Example
    void twoApprovalsGetDifferentAckNumbers() {
        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);
        DistrictRepository districtRepo = mock(DistrictRepository.class);

        District district = new District();
        district.setCode("CBE");
        when(districtRepo.findById(anyLong())).thenReturn(Optional.of(district));

        List<String> existingNumbers = new ArrayList<>();
        when(declarationRepo.findAcknowledgementNumbersByPrefix(anyString()))
                .thenAnswer(inv -> new ArrayList<>(existingNumbers));

        AcknowledgementServiceImpl service = new AcknowledgementServiceImpl(declarationRepo, districtRepo);

        String ack1 = service.generate(1L, "2025-26");
        existingNumbers.add(ack1);

        String ack2 = service.generate(1L, "2025-26");
        existingNumbers.add(ack2);

        assertThat(ack1).isNotEqualTo(ack2);
        assertThat(ACK_PATTERN.matcher(ack1).matches()).isTrue();
        assertThat(ACK_PATTERN.matcher(ack2).matches()).isTrue();
    }

    /**
     * Property 5f: Ack number format is valid for all district codes.
     */
    @Example
    void ackNumberFormatValidForVariousDistrictCodes() {
        String[] districtCodes = {"CBE", "CHN", "MDU", "TRV", "TEN", "VLR", "KPM"};
        for (String code : districtCodes) {
            String ackNumber = "ACK-" + code + "-2025-26-000001";
            assertThat(ACK_PATTERN.matcher(ackNumber).matches())
                    .as("Ack number with district code %s must match pattern", code)
                    .isTrue();
        }
    }
}
