package com.templeregistry.service.impl.declaration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.AssetDeclarationVersion;
import com.templeregistry.repository.dc.*;
import com.templeregistry.repository.declaration.AssetDeclarationVersionRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.service.declaration.SnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Captures full JSON snapshots of asset declarations at key workflow events.
 * Serializes the declaration entity plus all 9 asset sub-tables into a single JSON blob.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotServiceImpl implements SnapshotService {

    private final AssetDeclarationVersionRepository versionRepository;
    private final DeclarationRepository declarationRepository;
    private final DeclImmovAgriLandRepository agriLandRepository;
    private final DeclImmovBuildingRepository buildingRepository;
    private final DeclImmovLeasedRepository leasedRepository;
    private final DeclImmovOtherRepository otherLandRepository;
    private final DeclMovPreciousMetalRepository preciousMetalRepository;
    private final DeclMovArtifactRepository artifactRepository;
    private final DeclMovVehicleRepository vehicleRepository;
    private final DeclMovEquipmentRepository equipmentRepository;
    private final DeclMovFinancialRepository financialRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public AssetDeclarationVersion capture(AssetDeclaration declaration, Long actorId) {
        // Build a comprehensive snapshot map including all sub-tables
        Map<String, Object> snapshotMap = new LinkedHashMap<>();
        snapshotMap.put("id", declaration.getId());
        snapshotMap.put("templeId", declaration.getTempleId());
        snapshotMap.put("districtId", declaration.getDistrictId());
        snapshotMap.put("financialYear", declaration.getFinancialYear());
        snapshotMap.put("status", declaration.getStatus() != null ? declaration.getStatus().name() : null);
        snapshotMap.put("versionNumber", declaration.getVersionNumber());
        snapshotMap.put("submittedAt", declaration.getSubmittedAt());
        snapshotMap.put("submittedBy", declaration.getSubmittedBy());
        snapshotMap.put("reviewedAt", declaration.getReviewedAt());
        snapshotMap.put("reviewedBy", declaration.getReviewedBy());
        snapshotMap.put("acknowledgedAt", declaration.getAcknowledgedAt());
        snapshotMap.put("acknowledgementNumber", declaration.getAcknowledgementNumber());
        snapshotMap.put("clarificationRound", declaration.getClarificationRound());
        snapshotMap.put("isOverdue", declaration.isOverdue());
        snapshotMap.put("dueDate", declaration.getDueDate());
        snapshotMap.put("annualIncome", declaration.getAnnualIncome());
        snapshotMap.put("annualExpenditure", declaration.getAnnualExpenditure());
        snapshotMap.put("agriculturalLandAcres", declaration.getAgriculturalLandAcres());
        snapshotMap.put("agriculturalLandValue", declaration.getAgriculturalLandValue());
        snapshotMap.put("buildingsSqft", declaration.getBuildingsSqft());
        snapshotMap.put("buildingsValue", declaration.getBuildingsValue());
        snapshotMap.put("leasedPropertiesCount", declaration.getLeasedPropertiesCount());
        snapshotMap.put("leasedPropertiesValue", declaration.getLeasedPropertiesValue());
        snapshotMap.put("otherLandValue", declaration.getOtherLandValue());
        snapshotMap.put("goldGrams", declaration.getGoldGrams());
        snapshotMap.put("silverGrams", declaration.getSilverGrams());
        snapshotMap.put("idolsCount", declaration.getIdolsCount());
        snapshotMap.put("vehiclesCount", declaration.getVehiclesCount());
        snapshotMap.put("financialAssetsValue", declaration.getFinancialAssetsValue());
        snapshotMap.put("otherMovableValue", declaration.getOtherMovableValue());
        snapshotMap.put("remarks", declaration.getReviewComment());

        // Include all 9 asset sub-tables
        Long declarationId = declaration.getId();
        snapshotMap.put("agriculturalLands", agriLandRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("buildings", buildingRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("leasedProperties", leasedRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("otherLands", otherLandRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("preciousMetals", preciousMetalRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("artifacts", artifactRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("vehicles", vehicleRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("equipment", equipmentRepository.findAllByDeclarationId(declarationId));
        snapshotMap.put("financialAssets", financialRepository.findAllByDeclarationId(declarationId));

        String snapshotJson;
        try {
            snapshotJson = objectMapper.writeValueAsString(snapshotMap);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize declaration snapshot for id=" + declarationId, ex);
        }

        // Increment version number on the declaration
        declaration.setVersionNumber(declaration.getVersionNumber() + 1);
        declarationRepository.save(declaration);

        // Persist the version record
        AssetDeclarationVersion version = AssetDeclarationVersion.builder()
                .declarationId(declarationId)
                .versionNumber(declaration.getVersionNumber())
                .snapshotJson(snapshotJson)
                .createdByUserId(actorId != null ? actorId : 0L)
                .build();

        AssetDeclarationVersion saved = versionRepository.save(version);
        log.info("Snapshot captured for declaration [{}] version={} by actorId={}",
                declarationId, declaration.getVersionNumber(), actorId);
        return saved;
    }
}
