package com.templeregistry.dto.response.temple;

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
    private Long districtId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String contactName;
    private String contactDesignation;
    private String contactMobile;
    private String contactEmail;
    private String photoUrl;
    private String languagesOfWorship;
    private boolean trustRegistered;
    private String assetDeclarationStatus;
    /** UNVERIFIED | UNDER_REVIEW | VERIFIED | FLAGGED */
    private String verificationStatus;
}
