package com.templeregistry.service.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.*;
import com.templeregistry.dto.response.temple.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TempleService {

    PaginatedResponse<TempleSearchResultResponse> search(TempleSearchFilterRequest filter);

    TempleResponse create(CreateTempleRequest request);

    TempleResponse getById(Long id);

    TempleResponse update(Long id, UpdateTempleRequest request);
    /**
     * Returns the current approved temple profile (main table, not staging).
     */
    TempleResponse getCurrentProfile(Long templeId);

    String uploadPrimaryPhoto(Long templeId, MultipartFile file);

    List<String> uploadTemplePhotos(Long templeId, List<MultipartFile> files);

    List<TemplePhotoDto> getTemplePhotos(Long templeId);

    void deleteTemplePhoto(Long templeId, Long photoId);
}
