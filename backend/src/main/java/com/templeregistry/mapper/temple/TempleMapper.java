package com.templeregistry.mapper.temple;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.temple.CreateTempleRequest;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.dto.response.temple.TempleSearchResultResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleSearchSummary;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class TempleMapper {

    @Autowired
    protected ObjectMapper mapper;

    // =========================
    // CREATE REQUEST → ENTITY
    // =========================
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "trustRegistered", ignore = true)
    @Mapping(target = "assetDeclarationStatus", ignore = true)

    // Handle unmapped fields
    @Mapping(target = "hobli", ignore = true)
    @Mapping(target = "photos", ignore = true)
    @Mapping(target = "status", ignore = true)

    // Resolve ambiguity explicitly
    @Mapping(
        target = "languagesOfWorship",
        source = "languagesOfWorship",
        qualifiedByName = "listToJson"
    )
    public abstract Temple fromCreateRequest(CreateTempleRequest request);

    // =========================
    // ENTITY → RESPONSE
    // =========================
    @Mapping(
        target = "languagesOfWorship",
        source = "languagesOfWorship",
        qualifiedByName = "stringToList"
    )
    public abstract TempleResponse toTempleResponse(Temple entity);

    // =========================
    // SEARCH SUMMARY → RESPONSE
    // =========================
    @Mapping(target = "id", source = "templeId")
    @Mapping(target = "grade", source = "grade")
    public abstract TempleSearchResultResponse toSearchResult(TempleSearchSummary summary);

    // =========================
    // CUSTOM MAPPERS
    // =========================

    /**
     * Converts List<String> → JSON String (for DB storage)
     */
    @Named("listToJson")
    public String mapToJson(List<String> value) {
        if (value == null || value.isEmpty()) return "[]";
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }

    /**
     * Converts JSON String OR comma-separated String → List<String>
     */
    @Named("stringToList")
    public List<String> mapToList(String value) {
        if (value == null || value.isBlank()) return Collections.emptyList();

        // If JSON format
        if (value.startsWith("[")) {
            try {
                return mapper.readValue(value, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                return Collections.emptyList();
            }
        }

        // Fallback: comma-separated
        return Arrays.asList(value.split(",\\s*"));
    }

    /**
     * Optional: Converts List<String> → comma-separated String
     * (use if needed elsewhere)
     */
    @Named("listToCommaSeparated")
    public String mapToCommaSeparated(List<String> value) {
        if (value == null || value.isEmpty()) return null;
        return String.join(", ", value);
    }
}