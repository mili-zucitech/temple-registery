package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Movable asset sub-table: financial assets (FDs, investments, bonds, etc.) per declaration.
 * dc_e2e Section 4.8a / V38 migration: decl_mov_financial.
 */
@Entity
@Table(
        name = "decl_mov_financial",
        indexes = {
                @Index(name = "idx_dmf_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclMovFinancial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields - Fixed Deposits (Bank, Amount, Maturity), Investments
    @Column(name = "asset_type", nullable = false, length = 100)
    private String assetType; // FIXED_DEPOSIT, SAVINGS_ACCOUNT, MUTUAL_FUND, BOND, SHARE, OTHER

    @Column(name = "institution_name", length = 255)
    private String institutionName;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "current_value", nullable = false, precision = 18, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
