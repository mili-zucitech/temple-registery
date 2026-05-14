package com.templeregistry.dto.response.temple;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.templeregistry.entity.temple.ReligiousTradition;
import com.templeregistry.entity.temple.TempleGrade;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class TempleResponse {
    private Long id;
    private String registrationNumber;
    private String name;
    private String aliasName;
    private TempleGrade grade;
    private String primaryDeity;
    private ReligiousTradition tradition;
    private Integer yearEstablished;
    private String history;
    private String doorNumber;
    private String street;
    private String villageTown;
    private String pinCode;
    private Long hobliId;
    private Long talukId;
    private Long cityId;
    private String cityName;
    private Long districtId;
    private String districtName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String contactName;
    private String contactDesignation;
    private String contactMobile;
    private String contactEmail;
    private String photoUrl;
    private String website;
    private String languagesOfWorship;
    private String linkedInstitutions;
    private String annualFestivals;
    private String landmark;
    private String historicalSignificance;
    private String bankName;
    private String bankIfsc;
    @JsonProperty("trustRegistered")
    private boolean trustRegistered;
    private String assetDeclarationStatus;
    private String status;
    private String verificationStatus;
    private String dcRejectionReason;
}
