package com.templeregistry.dto.request.auth;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

import java.math.BigDecimal;

/**
 * Temple details submitted as part of Step 3 (createAccount).
 * GPS validation follows schema spec: latitude -90 to 90, longitude -180 to 180.
 */
@Getter
@NoArgsConstructor
public class TempleRegistrationRequest {

    @NotBlank(message = "Temple name is required.")
    @Size(max = 255, message = "Temple name must not exceed 255 characters.")
    private String name;

    @Size(max = 200, message = "Alias name must not exceed 200 characters.")
    private String aliasName;

    @NotBlank(message = "Deity name is required.")
    @Size(max = 255, message = "Deity name must not exceed 255 characters.")
    private String deityName;

    @NotNull(message = "Grade is required.")
    @Pattern(regexp = "^[ABC]$", message = "Grade must be A, B, or C.")
    private String grade;

    @NotBlank(message = "Religious tradition is required.")
    @Pattern(regexp = "^(SHAIVITE|VAISHNAVITE|SHAKTA|JAIN|BUDDHIST|OTHER)$",
            message = "Religious tradition must be one of: SHAIVITE, VAISHNAVITE, SHAKTA, JAIN, BUDDHIST, OTHER.")
    private String religiousTradition;

    @NotNull(message = "Hobli ID is required.")
    @Positive(message = "Hobli ID must be a positive number.")
    private Long hobliId;

    @NotBlank(message = "Address line 1 is required.")
    @Size(max = 255, message = "Address line 1 must not exceed 255 characters.")
    private String addressLine1;

    @NotBlank(message = "Pincode is required.")
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be exactly 6 digits.")
    private String pincode;

    @DecimalMin(value = "-90.0", message = "GPS latitude must be between -90 and 90.")
    @DecimalMax(value = "90.0",  message = "GPS latitude must be between -90 and 90.")
    private BigDecimal gpsLatitude;

    @DecimalMin(value = "-180.0", message = "GPS longitude must be between -180 and 180.")
    @DecimalMax(value = "180.0",  message = "GPS longitude must be between -180 and 180.")
    private BigDecimal gpsLongitude;

    @Min(value = 1, message = "Year established must be a positive year.")
    @Max(value = 2100, message = "Year established must not exceed 2100.")
    private Integer yearEstablished;
}
