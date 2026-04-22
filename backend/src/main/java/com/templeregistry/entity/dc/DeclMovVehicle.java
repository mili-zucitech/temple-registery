package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Movable asset sub-table: vehicle items per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_mov_vehicle.
 */
@Entity
@Table(
        name = "decl_mov_vehicle",
        indexes = {
                @Index(name = "idx_dmv_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclMovVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "registration_number", length = 20)
    private String registrationNumber;

    @Column(name = "make_and_model", length = 200)
    private String makeAndModel;

    @Column(name = "year_of_purchase")
    private Integer yearOfPurchase;

    @Column(name = "usage_purpose", length = 200)
    private String usagePurpose;

    // Additional fields from V38 migration
    @Column(name = "vehicle_type", length = 100)
    private String vehicleType;

    @Column(name = "current_value", precision = 15, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "insurance_valid_till")
    private java.time.LocalDate insuranceValidTill;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
