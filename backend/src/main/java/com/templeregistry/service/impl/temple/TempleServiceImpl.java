package com.templeregistry.service.impl.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.*;
import com.templeregistry.dto.response.temple.*;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TemplePhoto;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.temple.TempleMapper;
import com.templeregistry.repository.temple.TemplePhotoRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.temple.TempleService;
import com.templeregistry.util.PaginationUtil;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TempleServiceImpl implements TempleService {

    private final TempleRepository templeRepository;
    private final TempleSearchSummaryRepository summaryRepository;
    private final TempleMapper templeMapper;
    private final TemplePhotoRepository templePhotoRepository;
    private final FileStorageService fileStorageService;
    private final PaginationUtil paginationUtil;
    private final JurisdictionGuard jurisdictionGuard;
    private final OwnershipGuard ownershipGuard;
    private final TempleSearchSummaryService summaryService;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<TempleSearchResultResponse> search(TempleSearchFilterRequest filter) {
        int size = paginationUtil.clampSize(filter.getSize());
        Long scopedDistrictId = jurisdictionGuard.enforceDistrictId(filter.getDistrictId());

        Specification<TempleSearchSummary> spec = buildSpec(filter, scopedDistrictId);

        Sort sort = Sort.by(Sort.Direction.ASC, "name");
        Page<TempleSearchSummary> page = summaryRepository.findAll(
                spec, PageRequest.of(filter.getPage(), size, sort));

        Page<TempleSearchResultResponse> mapped = page.map(templeMapper::toSearchResult);
        return PaginatedResponse.of(mapped);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TempleResponse create(CreateTempleRequest request) {
        if (templeRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new DuplicateResourceException(
                    "Temple with registration number [" + request.getRegistrationNumber() + "] already exists.");
        }
        Temple temple = templeMapper.fromCreateRequest(request);
        Temple saved = templeRepository.save(temple);
        summaryService.refresh(saved.getId());
        log.info("Temple created: id=[{}], reg=[{}]", saved.getId(), saved.getRegistrationNumber());
        return templeMapper.toTempleResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TempleResponse getById(Long id) {
        Temple temple = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(temple.getDistrictId());
        ownershipGuard.assertOwnsTemple(id);
        return templeMapper.toTempleResponse(temple);
    }

    @Override
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public TempleResponse update(Long id, UpdateTempleRequest request) {
        Temple temple = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(id);
        applyUpdates(temple, request);
        Temple saved = templeRepository.save(temple);
        summaryService.refresh(saved.getId());
        log.info("Temple updated: id=[{}]", saved.getId());
        return templeMapper.toTempleResponse(saved);
    }

    private Temple findOrThrow(Long id) {
        return templeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Temple", id));
    }

    private void applyUpdates(Temple temple, UpdateTempleRequest rq) {
        if (rq.getName() != null)               temple.setName(rq.getName());
        if (rq.getAliasName() != null)          temple.setAliasName(rq.getAliasName());
        if (rq.getGrade() != null)              temple.setGrade(rq.getGrade());
        if (rq.getPrimaryDeity() != null)       temple.setPrimaryDeity(rq.getPrimaryDeity());
        if (rq.getTradition() != null)          temple.setTradition(com.templeregistry.entity.temple.ReligiousTradition.valueOf(rq.getTradition()));
        if (rq.getYearEstablished() != null)    temple.setYearEstablished(rq.getYearEstablished());
        if (rq.getHistory() != null)            temple.setHistory(rq.getHistory());
        if (rq.getDoorNumber() != null)         temple.setDoorNumber(rq.getDoorNumber());
        if (rq.getStreet() != null)             temple.setStreet(rq.getStreet());
        if (rq.getVillageTown() != null)        temple.setVillageTown(rq.getVillageTown());
        if (rq.getPinCode() != null)            temple.setPinCode(rq.getPinCode());
        if (rq.getHobliId() != null)            temple.setHobliId(rq.getHobliId());
        if (rq.getTalukId() != null)            temple.setTalukId(rq.getTalukId());
        if (rq.getLatitude() != null)           temple.setLatitude(rq.getLatitude());
        if (rq.getLongitude() != null)          temple.setLongitude(rq.getLongitude());
        if (rq.getContactName() != null)        temple.setContactName(rq.getContactName());
        if (rq.getContactDesignation() != null) temple.setContactDesignation(rq.getContactDesignation());
        if (rq.getContactMobile() != null)      temple.setContactMobile(rq.getContactMobile());
        if (rq.getContactEmail() != null)       temple.setContactEmail(rq.getContactEmail());
        if (rq.getLanguagesOfWorship() != null) temple.setLanguagesOfWorship(rq.getLanguagesOfWorship());
    }

    private Specification<TempleSearchSummary> buildSpec(TempleSearchFilterRequest f, Long districtId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (districtId != null) predicates.add(cb.equal(root.get("districtId"), districtId));
            if (f.getTalukId() != null) predicates.add(cb.equal(root.get("talukId"), f.getTalukId()));
            if (f.getHobliId() != null) predicates.add(cb.equal(root.get("hobliId"), f.getHobliId()));
            if (f.getGrade() != null && !f.getGrade().isEmpty())
                predicates.add(root.get("grade").in(f.getGrade()));
            if (f.getKeyword() != null && !f.getKeyword().isBlank())
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + f.getKeyword().toLowerCase() + "%"));
            if (f.getDeityName() != null && !f.getDeityName().isBlank())
                predicates.add(cb.like(cb.lower(root.get("primaryDeity")), "%" + f.getDeityName().toLowerCase() + "%"));
            if (f.getTradition() != null) predicates.add(cb.equal(root.get("tradition"), f.getTradition()));
            if (f.getTrustRegistered() != null) predicates.add(cb.equal(root.get("trustRegistered"), f.getTrustRegistered()));
            if (f.getDeclarationStatus() != null) predicates.add(cb.equal(root.get("assetDeclarationStatus"), f.getDeclarationStatus()));
            if (f.getEstablishedYearFrom() != null) predicates.add(cb.greaterThanOrEqualTo(root.get("yearEstablished"), f.getEstablishedYearFrom()));
            if (f.getEstablishedYearTo() != null) predicates.add(cb.lessThanOrEqualTo(root.get("yearEstablished"), f.getEstablishedYearTo()));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TempleResponse getCurrentProfile(Long templeId) {
        Temple temple = templeRepository.findById(templeId)
            .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        return templeMapper.toTempleResponse(temple);
    }

    @Override
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public String uploadPrimaryPhoto(Long templeId, MultipartFile file) {
        return uploadTemplePhotos(templeId, List.of(file)).stream().findFirst().orElse(null);
    }

    @Override
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public List<String> uploadTemplePhotos(Long templeId, List<MultipartFile> files) {
        Temple temple = findOrThrow(templeId);
        ownershipGuard.assertOwnsTemple(templeId);
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<TemplePhoto> existing = templePhotoRepository.findByTempleIdOrderByDisplayOrderAsc(templeId);
        int nextOrder = existing.size();
        boolean hasPrimary = existing.stream().anyMatch(TemplePhoto::isPrimary);
        List<String> uploadedUrls = new ArrayList<>();

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            String path = fileStorageService.upload("temples/" + templeId + "/photos", file);
            boolean makePrimary = !hasPrimary && i == 0;

            TemplePhoto photo = TemplePhoto.builder()
                    .temple(temple)
                    .filePath(path)
                    .originalFilename(file.getOriginalFilename())
                    .isPrimary(makePrimary)
                    .displayOrder(nextOrder++)
                    .build();
            templePhotoRepository.save(photo);

            if (makePrimary) {
                temple.setPhotoUrl(path);
                hasPrimary = true;
            }
            uploadedUrls.add(fileStorageService.presignedUrl(path));
        }

        templeRepository.save(temple);
        return uploadedUrls;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<TemplePhotoDto> getTemplePhotos(Long templeId) {
        findOrThrow(templeId);
        ownershipGuard.assertOwnsTemple(templeId);
        return templePhotoRepository.findByTempleIdOrderByDisplayOrderAsc(templeId).stream()
                .map(photo -> new TemplePhotoDto(
                        photo.getId(),
                        fileStorageService.presignedUrl(photo.getFilePath()),
                        photo.isPrimary(),
                        photo.getOriginalFilename(),
                        photo.getCreatedAt(),
                        photo.getWidth(),
                        photo.getHeight()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void deleteTemplePhoto(Long templeId, Long photoId) {
        Temple temple = findOrThrow(templeId);
        ownershipGuard.assertOwnsTemple(templeId);
        TemplePhoto target = templePhotoRepository.findById(photoId)
                .orElseThrow(() -> new EntityNotFoundException("TemplePhoto", photoId));
        if (!target.getTemple().getId().equals(templeId)) {
            throw new EntityNotFoundException("TemplePhoto", photoId);
        }

        boolean wasPrimary = target.isPrimary();
        templePhotoRepository.delete(target);
        fileStorageService.delete(target.getFilePath());

        List<TemplePhoto> remaining = templePhotoRepository.findByTempleIdOrderByDisplayOrderAsc(templeId);
        if (remaining.isEmpty()) {
            temple.setPhotoUrl(null);
        } else if (wasPrimary) {
            TemplePhoto newPrimary = remaining.get(0);
            newPrimary.setPrimary(true);
            templePhotoRepository.save(newPrimary);
            temple.setPhotoUrl(newPrimary.getFilePath());
        }
        templeRepository.save(temple);
    }
}
