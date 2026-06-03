package com.templeregistry.util.pdf;

import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Government-grade acknowledgement certificate template for approved asset declarations.
 *
 * <p>Design: Official government certificate layout with:
 * <ul>
 *   <li>Prominent acknowledgement number as certificate reference</li>
 *   <li>Status badge (APPROVED / REJECTED)</li>
 *   <li>Two-column info grid: temple details, financial details</li>
 *   <li>Reviewing officer section</li>
 *   <li>Official remarks block</li>
 *   <li>Validity notice and legal disclaimer</li>
 *   <li>Page footer with page number</li>
 * </ul>
 *
 * <p>Usage:
 * <pre>{@code
 *   byte[] pdf = AcknowledgementTemplate.builder()
 *       .acknowledgementNumber("ACK-2025-001234")
 *       .declarationId(42L)
 *       .templeName("Brihadeeswarar Temple")
 *       .templeId(10L)
 *       .districtId(5L)
 *       .financialYear("2024-25")
 *       .annualIncome("12,50,000")
 *       .annualExpenditure("9,80,000")
 *       .version("3")
 *       .status("APPROVED")
 *       .reviewedBy("DC_USER / Collector Anbu Selvan")
 *       .reviewedAt(LocalDateTime.now())
 *       .remarks("All supporting documents verified. Declaration approved.")
 *       .build()
 *       .render();
 * }</pre>
 */
public final class AcknowledgementTemplate {

    private final String        acknowledgementNumber;
    private final Long          declarationId;
    private final String        templeName;
    private final Long          templeId;
    private final Long          districtId;
    private final String        financialYear;
    private final String        annualIncome;
    private final String        annualExpenditure;
    private final String        version;
    private final String        status;
    private final String        reviewedBy;
    private final LocalDateTime reviewedAt;
    private final String        remarks;

    private AcknowledgementTemplate(Builder b) {
        this.acknowledgementNumber = b.acknowledgementNumber;
        this.declarationId         = b.declarationId;
        this.templeName            = b.templeName;
        this.templeId              = b.templeId;
        this.districtId            = b.districtId;
        this.financialYear         = b.financialYear;
        this.annualIncome          = b.annualIncome;
        this.annualExpenditure     = b.annualExpenditure;
        this.version               = b.version;
        this.status                = b.status;
        this.reviewedBy            = b.reviewedBy;
        this.reviewedAt            = b.reviewedAt;
        this.remarks               = b.remarks;
    }

    public static Builder builder() { return new Builder(); }

    // ─── Render ───────────────────────────────────────────────────────────────

    public byte[] render() {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            PdfWriter   pdfWriter = new PdfWriter(bos);
            PdfDocument pdfDoc    = new PdfDocument(pdfWriter);

            pdfDoc.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterEventHandler());

            Document document = new Document(pdfDoc);
            document.setMargins(72f, 50f, 60f, 50f);

            renderContent(document, pdfDoc);

            document.close();
            return bos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Acknowledgement PDF generation failed", e);
        }
    }

    // ─── Content Rendering ────────────────────────────────────────────────────

    private void renderContent(Document document, PdfDocument pdfDoc) {
        // ── Page header
        PdfDesignSystem.addPageHeader(
            document,
            "Declaration Acknowledgement",
            "Asset Declaration Acknowledgement Certificate",
            null
        );

        // ── Reference number banner
        addAcknowledgementBanner(document);

        // ── Status badge
        document.add(
            PdfDesignSystem.buildStatusBadge(status != null ? status : "APPROVED")
                .setMarginBottom(PdfDesignSystem.PADDING_SECTION)
        );

        // ── Temple Details section
        PdfDesignSystem.addSectionDivider(document, "Temple Information");
        document.add(PdfDesignSystem.buildInfoGrid(new String[][]{
            {"Temple Name",     PdfDesignSystem.safeStr(templeName),
             "Temple ID",       PdfDesignSystem.safeStr(templeId)},
            {"District ID",     PdfDesignSystem.safeStr(districtId),
             "Financial Year",  PdfDesignSystem.safeStr(financialYear)},
        }));

        // ── Declaration Details section
        PdfDesignSystem.addSectionDivider(document, "Declaration Details");
        document.add(PdfDesignSystem.buildInfoGrid(new String[][]{
            {"Declaration ID",     PdfDesignSystem.safeStr(declarationId),
             "Version",            PdfDesignSystem.safeStr(version)},
            {"Annual Income (₹)",  PdfDesignSystem.safeStr(annualIncome),
             "Annual Expenditure (₹)", PdfDesignSystem.safeStr(annualExpenditure)},
            {"Declaration Status", PdfDesignSystem.formatStatus(status),
             "Review Date",        reviewedAt != null ? reviewedAt.format(PdfDesignSystem.DATETIME_FORMATTER) : "—"},
        }));

        // ── Reviewing Officer section
        PdfDesignSystem.addSectionDivider(document, "Reviewing Officer");
        document.add(PdfDesignSystem.buildInfoGrid(new String[][]{
            {"Reviewed By",    PdfDesignSystem.safeStr(reviewedBy),
             "Reviewed At",    reviewedAt != null ? reviewedAt.format(PdfDesignSystem.DATETIME_FORMATTER) : "—"},
        }));

        // ── Remarks
        if (remarks != null && !remarks.isBlank()) {
            PdfDesignSystem.addSectionDivider(document, "Remarks / Review Notes");
            Table remarksBox = new Table(1)
                .useAllAvailableWidth()
                .setMarginBottom(PdfDesignSystem.PADDING_SECTION)
                .setBorder(new SolidBorder(PdfDesignSystem.COLOR_BORDER, 0.5f));
            remarksBox.addCell(
                new Cell()
                    .add(new Paragraph(remarks)
                        .setFont(PdfDesignSystem.fontRegular())
                        .setFontSize(PdfDesignSystem.FONT_BODY)
                        .setFontColor(PdfDesignSystem.COLOR_TEXT_PRIMARY))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                    .setPadding(PdfDesignSystem.PADDING_SECTION)
            );
            document.add(remarksBox);
        }

        // ── Divider before legal block
        PdfDesignSystem.addHorizontalRule(document);

        // ── Legal notice
        addLegalNotice(document);
    }

    // ─── Acknowledgement Banner ───────────────────────────────────────────────

    private void addAcknowledgementBanner(Document document) {
        Table banner = new Table(1)
            .useAllAvailableWidth()
            .setBackgroundColor(PdfDesignSystem.COLOR_PRIMARY)
            .setMarginBottom(PdfDesignSystem.PADDING_SECTION)
            .setBorderTop(new SolidBorder(PdfDesignSystem.COLOR_ACCENT, 3f))
            .setBorderBottom(new SolidBorder(PdfDesignSystem.COLOR_ACCENT, 1f));

        banner.addCell(
            new Cell()
                .add(new Paragraph("ACKNOWLEDGEMENT NUMBER")
                    .setFont(PdfDesignSystem.fontRegular())
                    .setFontSize(PdfDesignSystem.FONT_SMALL)
                    .setFontColor(PdfDesignSystem.COLOR_ACCENT)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(2f))
                .add(new Paragraph(PdfDesignSystem.safeStr(acknowledgementNumber))
                    .setFont(PdfDesignSystem.fontBold())
                    .setFontSize(PdfDesignSystem.FONT_DISPLAY)
                    .setFontColor(PdfDesignSystem.COLOR_WHITE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(2f))
                .add(new Paragraph("Asset Declaration — Temple Registry Management System")
                    .setFont(PdfDesignSystem.fontItalic())
                    .setFontSize(PdfDesignSystem.FONT_TINY)
                    .setFontColor(PdfDesignSystem.COLOR_ACCENT)
                    .setTextAlignment(TextAlignment.CENTER))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setPadding(20f)
        );

        document.add(banner);
    }

    // ─── Legal Notice ─────────────────────────────────────────────────────────

    private void addLegalNotice(Document document) {
        String notice =
            "This acknowledgement certifies that the above-referenced asset declaration has been " +
            "received and processed by the Temple Registry Management System, Government of Karnataka. " +
            "This document serves as official confirmation of the declaration status indicated above. " +
            "For queries, contact your jurisdictional District Collector's office. " +
            "Document Reference: " + PdfDesignSystem.safeStr(acknowledgementNumber) +
            " | Generated: " + LocalDateTime.now().format(PdfDesignSystem.DATETIME_FORMATTER);

        document.add(
            new Paragraph(notice)
                .setFont(PdfDesignSystem.fontItalic())
                .setFontSize(PdfDesignSystem.FONT_TINY)
                .setFontColor(PdfDesignSystem.COLOR_TEXT_MUTED)
                .setTextAlignment(TextAlignment.LEFT)
                .setBorder(new SolidBorder(PdfDesignSystem.COLOR_BORDER, 0.5f))
                .setPadding(PdfDesignSystem.PADDING_SECTION)
                .setMarginTop(8f)
        );
    }

    // ─── Footer Event Handler ─────────────────────────────────────────────────

    private static class FooterEventHandler implements IEventHandler {
        private int pageNumber = 0;

        @Override
        public void handleEvent(Event event) {
            pageNumber++;
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfPage page = docEvent.getPage();
            PdfDocument pdfDoc = docEvent.getDocument();
            PdfCanvas canvas = new PdfCanvas(page, true);
            PdfDesignSystem.renderFooter(canvas, pdfDoc.getDefaultPageSize(), pageNumber);
            canvas.release();
        }
    }

    // ─── Builder ─────────────────────────────────────────────────────────────

    public static final class Builder {
        private String        acknowledgementNumber;
        private Long          declarationId;
        private String        templeName;
        private Long          templeId;
        private Long          districtId;
        private String        financialYear;
        private String        annualIncome;
        private String        annualExpenditure;
        private String        version;
        private String        status         = "APPROVED";
        private String        reviewedBy;
        private LocalDateTime reviewedAt;
        private String        remarks;

        public Builder acknowledgementNumber(String n) { this.acknowledgementNumber = n; return this; }
        public Builder declarationId(Long id)          { this.declarationId = id; return this; }
        public Builder templeName(String name)         { this.templeName = name; return this; }
        public Builder templeId(Long id)               { this.templeId = id; return this; }
        public Builder districtId(Long id)             { this.districtId = id; return this; }
        public Builder financialYear(String fy)        { this.financialYear = fy; return this; }
        public Builder annualIncome(String income)     { this.annualIncome = income; return this; }
        public Builder annualExpenditure(String exp)   { this.annualExpenditure = exp; return this; }
        public Builder version(String v)               { this.version = v; return this; }
        public Builder status(String s)                { this.status = s; return this; }
        public Builder reviewedBy(String by)           { this.reviewedBy = by; return this; }
        public Builder reviewedAt(LocalDateTime at)    { this.reviewedAt = at; return this; }
        public Builder remarks(String r)               { this.remarks = r; return this; }

        public AcknowledgementTemplate build() { return new AcknowledgementTemplate(this); }
    }
}
