package com.templeregistry.service.impl.contractor;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.contractor.CreateContractorRequest;
import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.entity.contractor.Contractor;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.contractor.ContractorService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractorServiceImpl implements ContractorService {

    private final ContractorRepository contractorRepository;
    private final OwnershipGuard ownershipGuard;
    private final PaginationUtil paginationUtil;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<ContractorResponse> listByTemple(Long templeId, int page, int size) {
        ownershipGuard.assertOwnsTemple(templeId);
        Page<Contractor> result = contractorRepository.findAllByTempleId(
                templeId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public ContractorResponse create(Long templeId, CreateContractorRequest rq) {
        ownershipGuard.assertOwnsTemple(templeId);
        Contractor c = Contractor.builder()
                .templeId(templeId).name(rq.getName()).gstNumber(rq.getGstNumber())
                .serviceType(rq.getServiceType()).contractReference(rq.getContractReference())
                .workOrderDate(rq.getWorkOrderDate()).contractStartDate(rq.getContractStartDate())
                .contractEndDate(rq.getContractEndDate()).contractValue(rq.getContractValue())
                .paymentStatus(rq.getPaymentStatus()).documentId(rq.getDocumentId()).build();
        return toResponse(contractorRepository.save(c));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public ContractorResponse getById(Long id) {
        Contractor c = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(c.getTempleId());
        return toResponse(c);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public ContractorResponse update(Long id, CreateContractorRequest rq) {
        Contractor c = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(c.getTempleId());
        c.setName(rq.getName()); c.setGstNumber(rq.getGstNumber());
        c.setServiceType(rq.getServiceType()); c.setContractValue(rq.getContractValue());
        c.setPaymentStatus(rq.getPaymentStatus());
        return toResponse(contractorRepository.save(c));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void softDelete(Long id) {
        Contractor c = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(c.getTempleId());
        contractorRepository.deleteById(id);
        log.info("Contractor soft-deleted: id=[{}]", id);
    }

    private Contractor findOrThrow(Long id) {
        return contractorRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Contractor", id));
    }

    private ContractorResponse toResponse(Contractor c) {
        return ContractorResponse.builder()
                .id(c.getId()).templeId(c.getTempleId()).name(c.getName())
                .gstNumber(c.getGstNumber()).serviceType(c.getServiceType())
                .contractReference(c.getContractReference()).workOrderDate(c.getWorkOrderDate())
                .contractStartDate(c.getContractStartDate()).contractEndDate(c.getContractEndDate())
                .contractValue(c.getContractValue()).paymentStatus(c.getPaymentStatus()).build();
    }
}
