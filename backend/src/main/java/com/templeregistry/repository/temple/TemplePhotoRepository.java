package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.TemplePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplePhotoRepository extends JpaRepository<TemplePhoto, Long> {

    List<TemplePhoto> findByTempleIdOrderByDisplayOrderAsc(Long templeId);

    void deleteByTempleId(Long templeId);
}