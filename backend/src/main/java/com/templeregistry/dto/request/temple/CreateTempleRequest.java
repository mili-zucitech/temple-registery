package com.templeregistry.dto.request.temple;

import com.templeregistry.entity.temple.TempleGrade;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTempleRequest {

    @NotBlank(message = "Temple name is required.")
    @Size(max = 255) private String name;

    @Size(max = 255) private String aliasName;

    @NotBlank(message = "Registration number is required.")
    @Size(max = 50) private String registrationNumber;

    @NotNull(message = "Grade is required.") private TempleGrade grade;

    @NotBlank(message = "Primary deity is required.")
    @Size(max = 150) private String primaryDeity;

    private String tradition;
    private Integer yearEstablished;
    private String history;

    // Address
    @Size(max = 50) private String doorNumber;
    @Size(max = 255) private String street;
    @Size(max = 150) private String villageTown;
    @Size(max = 10) private String pinCode;
    private Long hobliId;
    private Long talukId;

    @NotNull(message = "District ID is required.") private Long districtId;

    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0") private BigDecimal latitude;
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0") private BigDecimal longitude;

    // Contact
    @Size(max = 200) private String contactName;
    @Size(max = 150) private String contactDesignation;
    @Size(max = 15) private String contactMobile;
    @Email @Size(max = 255) private String contactEmail;
    private java.util.List<String> languagesOfWorship;
}
