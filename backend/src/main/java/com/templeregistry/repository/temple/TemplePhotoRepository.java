package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.TemplePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemplePhotoRepository extends JpaRepository<TemplePhoto, Long> {

    List<TemplePhoto> findByTempleIdOrderByDisplayOrderAsc(Long templeId);

    /** Finds the primary photo for a temple — used by serveProfilePhoto to serve from DB. */
    Optional<TemplePhoto> findFirstByTempleIdAndIsPrimaryTrue(Long templeId);

    void deleteByTempleId(Long templeId);
}