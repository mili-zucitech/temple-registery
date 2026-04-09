package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.Temple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TempleRepository extends JpaRepository<Temple, Long>,
        JpaSpecificationExecutor<Temple> {

    Optional<Temple> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);
}
