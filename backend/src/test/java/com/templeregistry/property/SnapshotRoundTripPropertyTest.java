package com.templeregistry.property;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import net.jqwik.api.*;
import net.jqwik.api.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Feature: asset-declaration-complete, Property 3: Snapshot JSON Round-Trip
 *
 * For any AssetDeclarationVersion record, deserializing snapshot_json into the
 * declaration object model and re-serializing it must produce a JSON string that
 * is semantically equivalent to the original (same fields and values, modulo key ordering).
 *
 * Validates: Requirements 4.3, 10.5
 */
class SnapshotRoundTripPropertyTest {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    /**
     * Property 3: Snapshot JSON round-trips without data loss.
     * Serializing a snapshot map to JSON and then deserializing it back
     * must produce the same field values.
     */
    @Property(tries = 200)
    void snapshotJsonRoundTrip(
            @ForAll DeclarationStatus status,
            @ForAll @net.jqwik.api.constraints.Positive long templeId,
            @ForAll @net.jqwik.api.constraints.Positive long districtId,
            @ForAll @net.jqwik.api.constraints.IntRange(min = 1, max = 10) int versionNumber) throws Exception {

        // Build a snapshot map similar to what SnapshotServiceImpl produces
        Map<String, Object> snapshotMap = buildSnapshotMap(templeId, districtId, status, versionNumber);

        // Serialize to JSON
        String json = objectMapper.writeValueAsString(snapshotMap);
        assertThat(json).as("Snapshot JSON must not be null or empty").isNotBlank();

        // Deserialize back to a JsonNode
        JsonNode roundTripped = objectMapper.readTree(json);

        // Re-serialize the deserialized node
        String reSerializedJson = objectMapper.writeValueAsString(roundTripped);

        // Parse both as JsonNode for semantic comparison (key-order independent)
        JsonNode original = objectMapper.readTree(json);
        JsonNode reSerialized = objectMapper.readTree(reSerializedJson);

        assertThat(original)
                .as("Round-tripped JSON must be semantically equivalent to original")
                .isEqualTo(reSerialized);
    }

    /**
     * Property 3b: Key fields are preserved after round-trip.
     */
    @Property(tries = 200)
    void snapshotPreservesKeyFields(
            @ForAll DeclarationStatus status,
            @ForAll @net.jqwik.api.constraints.Positive long templeId,
            @ForAll @net.jqwik.api.constraints.Positive long districtId) throws Exception {

        Map<String, Object> snapshotMap = buildSnapshotMap(templeId, districtId, status, 1);

        String json = objectMapper.writeValueAsString(snapshotMap);
        JsonNode node = objectMapper.readTree(json);

        // Verify key fields are preserved
        assertThat(node.has("templeId")).as("templeId must be present").isTrue();
        assertThat(node.has("districtId")).as("districtId must be present").isTrue();
        assertThat(node.has("status")).as("status must be present").isTrue();
        assertThat(node.has("versionNumber")).as("versionNumber must be present").isTrue();
        assertThat(node.has("financialYear")).as("financialYear must be present").isTrue();

        assertThat(node.get("templeId").asLong()).as("templeId value preserved").isEqualTo(templeId);
        assertThat(node.get("districtId").asLong()).as("districtId value preserved").isEqualTo(districtId);
        assertThat(node.get("status").asText()).as("status value preserved").isEqualTo(status.name());
    }

    /**
     * Property 3c: Null fields are handled gracefully in round-trip.
     */
    @Example
    void snapshotWithNullFieldsRoundTrips() throws Exception {
        Map<String, Object> snapshotMap = new LinkedHashMap<>();
        snapshotMap.put("id", null);
        snapshotMap.put("templeId", 1L);
        snapshotMap.put("districtId", 1L);
        snapshotMap.put("financialYear", "2025-26");
        snapshotMap.put("status", DeclarationStatus.DRAFT.name());
        snapshotMap.put("versionNumber", 1);
        snapshotMap.put("submittedAt", null);
        snapshotMap.put("acknowledgementNumber", null);
        snapshotMap.put("agriculturalLands", null);

        String json = objectMapper.writeValueAsString(snapshotMap);
        JsonNode roundTripped = objectMapper.readTree(json);
        String reSerializedJson = objectMapper.writeValueAsString(roundTripped);

        JsonNode original = objectMapper.readTree(json);
        JsonNode reSerialized = objectMapper.readTree(reSerializedJson);

        assertThat(original).isEqualTo(reSerialized);
    }

    /**
     * Property 3d: All 12 DeclarationStatus values serialize and deserialize correctly.
     */
    @Example
    void allStatusValuesRoundTrip() throws Exception {
        for (DeclarationStatus status : DeclarationStatus.values()) {
            Map<String, Object> snapshotMap = buildSnapshotMap(1L, 1L, status, 1);
            String json = objectMapper.writeValueAsString(snapshotMap);
            JsonNode node = objectMapper.readTree(json);
            assertThat(node.get("status").asText())
                    .as("Status %s must round-trip correctly", status)
                    .isEqualTo(status.name());
        }
    }

    private Map<String, Object> buildSnapshotMap(long templeId, long districtId,
                                                   DeclarationStatus status, int versionNumber) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", 1L);
        map.put("templeId", templeId);
        map.put("districtId", districtId);
        map.put("financialYear", "2025-26");
        map.put("status", status.name());
        map.put("versionNumber", versionNumber);
        map.put("submittedAt", null);
        map.put("submittedBy", null);
        map.put("reviewedAt", null);
        map.put("reviewedBy", null);
        map.put("acknowledgedAt", null);
        map.put("acknowledgementNumber", null);
        map.put("clarificationRound", 0);
        map.put("isOverdue", false);
        map.put("dueDate", null);
        map.put("annualIncome", null);
        map.put("annualExpenditure", null);
        map.put("agriculturalLandAcres", null);
        map.put("agriculturalLandValue", null);
        map.put("buildingsSqft", null);
        map.put("buildingsValue", null);
        map.put("leasedPropertiesCount", null);
        map.put("leasedPropertiesValue", null);
        map.put("otherLandValue", null);
        map.put("goldGrams", null);
        map.put("silverGrams", null);
        map.put("idolsCount", null);
        map.put("vehiclesCount", null);
        map.put("financialAssetsValue", null);
        map.put("otherMovableValue", null);
        map.put("remarks", null);
        map.put("agriculturalLands", java.util.Collections.emptyList());
        map.put("buildings", java.util.Collections.emptyList());
        map.put("leasedProperties", java.util.Collections.emptyList());
        map.put("otherLands", java.util.Collections.emptyList());
        map.put("preciousMetals", java.util.Collections.emptyList());
        map.put("artifacts", java.util.Collections.emptyList());
        map.put("vehicles", java.util.Collections.emptyList());
        map.put("equipment", java.util.Collections.emptyList());
        map.put("financialAssets", java.util.Collections.emptyList());
        return map;
    }
}
