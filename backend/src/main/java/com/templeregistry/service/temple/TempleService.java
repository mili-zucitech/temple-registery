
package com.templeregistry.service.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.*;
import com.templeregistry.dto.response.temple.*;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface TempleService {

    PaginatedResponse<TempleSearchResultResponse> search(TempleSearchFilterRequest filter);

    TempleResponse create(CreateTempleRequest request);

    TempleResponse getById(Long id);

    TempleResponse update(Long id, UpdateTempleRequest request);

    /**
     * Upload or update the temple photo, storing the URL in the temple table.
     */
    List<String> uploadPhotos(Long templeId, List<MultipartFile> files);

    void deletePhoto(Long templeId, Long photoId);

    List<TemplePhotoDto> getTemplePhotos(Long templeId);

    /**
     * Returns the current approved temple profile (main table, not staging).
     */
    TempleResponse getCurrentProfile(Long templeId);
}
