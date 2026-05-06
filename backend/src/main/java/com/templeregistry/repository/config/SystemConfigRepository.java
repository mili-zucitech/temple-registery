package com.templeregistry.repository.config;

import com.templeregistry.entity.config.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    Optional<SystemConfig> findByConfigKeyAndDeletedFalse(String configKey);

    List<SystemConfig> findByCategoryAndDeletedFalse(String category);

    List<SystemConfig> findAllByDeletedFalse();
}
