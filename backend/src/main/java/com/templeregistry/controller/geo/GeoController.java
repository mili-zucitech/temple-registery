package com.templeregistry.controller.geo;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.geo.*;
import com.templeregistry.dto.response.geo.*;
import com.templeregistry.service.geo.GeoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/geo")
@RequiredArgsConstructor
@Tag(name = "Geo Hierarchy", description = "Cascading State â†’ City â†’ District â†’ Taluk â†’ Hobli lookup")
public class GeoController {

    private final GeoService geoService;

    @GetMapping("/states")
    @Operation(summary = "List all states")
    public ResponseEntity<ApiResponse<List<StateResponse>>> listStates() {
        return ResponseEntity.ok(ApiResponse.success("States retrieved.", geoService.listStates()));
    }

    @PostMapping("/states")
    @Operation(summary = "Create a state (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<StateResponse>> createState(@Valid @RequestBody CreateStateRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("State created.", geoService.createState(rq)));
    }

    @GetMapping("/states/{stateId}/cities")
    @Operation(summary = "List cities in a state")
    public ResponseEntity<ApiResponse<List<CityResponse>>> listCities(@PathVariable Long stateId) {
        return ResponseEntity.ok(ApiResponse.success("Cities retrieved.", geoService.listCitiesByState(stateId)));
    }

    @PostMapping("/cities")
    @Operation(summary = "Create a city (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<CityResponse>> createCity(@Valid @RequestBody CreateCityRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("City created.", geoService.createCity(rq)));
    }

    @GetMapping("/cities/{cityId}/districts")
    @Operation(summary = "List districts in a city")
    public ResponseEntity<ApiResponse<List<DistrictResponse>>> listDistricts(@PathVariable Long cityId) {
        return ResponseEntity.ok(ApiResponse.success("Districts retrieved.", geoService.listDistrictsByCity(cityId)));
    }

    @PostMapping("/districts")
    @Operation(summary = "Create a district (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<DistrictResponse>> createDistrict(@Valid @RequestBody CreateDistrictRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("District created.", geoService.createDistrict(rq)));
    }

    @GetMapping("/districts/{districtId}/taluks")
    @Operation(summary = "List taluks in a district")
    public ResponseEntity<ApiResponse<List<TalukResponse>>> listTaluks(@PathVariable Long districtId) {
        return ResponseEntity.ok(ApiResponse.success("Taluks retrieved.", geoService.listTaluksByDistrict(districtId)));
    }

    @PostMapping("/taluks")
    @Operation(summary = "Create a taluk (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<TalukResponse>> createTaluk(@Valid @RequestBody CreateTalukRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Taluk created.", geoService.createTaluk(rq)));
    }

    @GetMapping("/taluks/{talukId}/hoblis")
    @Operation(summary = "List hoblis in a taluk")
    public ResponseEntity<ApiResponse<List<HobliResponse>>> listHoblis(@PathVariable Long talukId) {
        return ResponseEntity.ok(ApiResponse.success("Hoblis retrieved.", geoService.listHoblisByTaluk(talukId)));
    }

    @PostMapping("/hoblis")
    @Operation(summary = "Create a hobli (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<HobliResponse>> createHobli(@Valid @RequestBody CreateHobliRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Hobli created.", geoService.createHobli(rq)));
    }
}
