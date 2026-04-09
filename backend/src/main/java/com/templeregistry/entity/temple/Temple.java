package com.templeregistry.entity.temple;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.entity.geo.Hobli;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "temples", indexes = {
        @Index(name = "idx_temples_district_id",  columnList = "district_id"),
        @Index(name = "idx_temples_hobli_id",     columnList = "hobli_id"),
        @Index(name = "idx_temples_grade",         columnList = "grade"),
        @Index(name = "idx_temples_registration",  columnList = "registration_number")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE temples SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Temple extends BaseEntity {

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "registration_number", nullable = false, unique = true, length = 50)
    private String registrationNumber;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "alias_name", length = 255)
    private String aliasName;

    @Enumerated(EnumType.STRING)
    @Column(name = "grade", nullable = false, length = 5)
    private TempleGrade grade;

    @Column(name = "primary_deity", nullable = false, length = 150)
    private String primaryDeity;

    @Enumerated(EnumType.STRING)
    @Column(name = "tradition", length = 30)
    private ReligiousTradition tradition;

    @Column(name = "year_established")
    private Integer yearEstablished;

    @Column(name = "history", columnDefinition = "TEXT")
    private String history;

    // Address
    @Column(name = "door_number", length = 50)
    private String doorNumber;

    @Column(name = "street", length = 255)
    private String street;

    @Column(name = "village_town", length = 150)
    private String villageTown;

    @Column(name = "pin_code", length = 10)
    private String pinCode;

    @Column(name = "hobli_id")
    private Long hobliId;

    /**
     * Lazy-loaded JPA relationship for assertDistrictScope traversal.
     * insertable/updatable=false because hobliId (above) owns the FK column.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hobli_id", insertable = false, updatable = false)
    private Hobli hobli;

    @Column(name = "taluk_id")
    private Long talukId;

    @Column(name = "district_id", nullable = false)
    private Long districtId;

    // GPS
    @Column(name = "latitude", precision = 10)
    private java.math.BigDecimal latitude;

    @Column(name = "longitude", precision = 11)
    private java.math.BigDecimal longitude;

    // Contact
    @Column(name = "contact_name", length = 200)
    private String contactName;

    @Column(name = "contact_designation", length = 150)
    private String contactDesignation;

    @Column(name = "contact_mobile", length = 15)
    private String contactMobile;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "languages_of_worship", length = 255)
    private String languagesOfWorship;

    @Column(name = "trust_registered", nullable = false)
    private boolean trustRegistered = false;

    @Column(name = "asset_declaration_status", length = 30)
    private String assetDeclarationStatus;
}
