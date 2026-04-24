package com.templeregistry.service.impl.declaration;

import com.templeregistry.dto.response.declaration.AcknowledgementResponse;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.geo.District;
import com.templeregistry.exception.AcknowledgementNotAvailableException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.service.declaration.AcknowledgementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Generates unique acknowledgement numbers in the format:
 * ACK-{DISTRICT_CODE}-{FINANCIAL_YEAR}-{SEQUENCE}
 * e.g. ACK-CBE-2025-26-000042
 *
 * Uses SERIALIZABLE isolation to prevent duplicate sequences under concurrent load.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AcknowledgementServiceImpl implements AcknowledgementService {

    private final DeclarationRepository declarationRepository;
    private final DistrictRepository districtRepository;

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public String generate(Long districtId, String financialYear) {
        return doGenerate(districtId, financialYear);
    }

    private String doGenerate(Long districtId, String financialYear) {
        District district = districtRepository.findById(districtId)
                .orElseThrow(() -> new EntityNotFoundException("District", districtId));

        String districtCode = district.getCode() != null ? district.getCode().toUpperCase() : "UNK";
        String prefix = "ACK-" + districtCode + "-" + financialYear + "-";

        // Query max sequence for this prefix
        List<String> existingNumbers = declarationRepository.findAcknowledgementNumbersByPrefix(prefix);
        long maxSeq = existingNumbers.stream()
                .mapToLong(ack -> {
                    try {
                        String seqPart = ack.substring(prefix.length());
                        return Long.parseLong(seqPart);
                    } catch (Exception e) {
                        return 0L;
                    }
                })
                .max()
                .orElse(0L);

        long nextSeq = maxSeq + 1;
        String ackNumber = prefix + String.format("%06d", nextSeq);
        log.info("Generated acknowledgement number: {}", ackNumber);
        return ackNumber;
    }

    @Override
    @Transactional(readOnly = true)
    public AcknowledgementResponse getForDeclaration(Long declarationId) {
        AssetDeclaration declaration = declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", declarationId));

        if (declaration.getStatus() != DeclarationStatus.APPROVED) {
            throw new AcknowledgementNotAvailableException(declarationId);
        }

        return AcknowledgementResponse.builder()
                .acknowledgementNumber(declaration.getAcknowledgementNumber())
                .generatedAt(declaration.getAcknowledgedAt() != null
                        ? declaration.getAcknowledgedAt()
                        : LocalDateTime.now())
                .build();
    }
}
