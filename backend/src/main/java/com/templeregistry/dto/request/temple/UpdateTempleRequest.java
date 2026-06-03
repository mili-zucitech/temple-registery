package com.templeregistry.dto.request.temple;

import com.templeregistry.entity.temple.TempleGrade;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
public class UpdateTempleRequest {

    @Size(max = 255) private String name;
    @Size(max = 255) private String aliasName;
    private TempleGrade grade;
    @Size(max = 150) private String primaryDeity;
    private String tradition;
    private Integer yearEstablished;
    private String history;
    @Size(max = 50) private String doorNumber;
    @Size(max = 255) private String street;
    @Size(max = 150) private String villageTown;
    @Size(max = 10) private String pinCode;
    private Long hobliId;
    private Long talukId;
    @DecimalMin("-90.0") @DecimalMax("90.0") private BigDecimal latitude;
    @DecimalMin("-180.0") @DecimalMax("180.0") private BigDecimal longitude;
    @Size(max = 200) private String contactName;
    @Size(max = 150) private String contactDesignation;
    @Size(max = 15) private String contactMobile;
    @Email @Size(max = 255) private String contactEmail;
    @Size(max = 255) private String languagesOfWorship;
}
