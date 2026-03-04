package com.mybill.billing.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.mybill.billing.entity.Bill;
import com.mybill.billing.entity.BillItem;
import com.mybill.billing.entity.Shop;
import com.mybill.billing.repository.BillRepository;
import com.mybill.billing.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final BillRepository billRepository;
    private final SecurityUtils securityUtils;
    private static final DecimalFormat MONEY = new DecimalFormat("0.00");
    private static final DateTimeFormatter INVOICE_DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public byte[] generateInvoice(Long billId) throws Exception {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (!bill.getShop().getId()
                .equals(securityUtils.getCurrentShopId())) {
            throw new RuntimeException("Unauthorized");
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 32, 32);

        PdfWriter.getInstance(document, out);
        document.open();

        Shop shop = bill.getShop();
        addHeader(document, shop, bill);
        addInvoiceMeta(document, bill);
        addItemsTable(document, bill);
        addTotals(document, bill);
        addFooter(document);
        document.close();

        return out.toByteArray();
    }

    private void addHeader(Document document, Shop shop, Bill bill) throws Exception {
        Font shopNameFont = new Font(Font.HELVETICA, 18, Font.BOLD, Color.BLACK);
        Font detailFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(70, 70, 70));
        Font invoiceTitleFont = new Font(Font.HELVETICA, 19, Font.BOLD, new Color(25, 84, 166));

        PdfPTable headerTable = new PdfPTable(new float[]{1.1f, 2.9f});
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(12);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Image logo = resolveLogo(shop);
        if (logo != null) {
            logo.scaleToFit(86, 86);
            logo.setAlignment(Element.ALIGN_LEFT);
            logoCell.addElement(logo);
        } else {
            logoCell.addElement(createDefaultLogoBadge());
        }

        PdfPCell detailsCell = new PdfPCell();
        detailsCell.setBorder(Rectangle.NO_BORDER);

        Paragraph invoiceTitle = new Paragraph("TAX INVOICE", invoiceTitleFont);
        invoiceTitle.setSpacingAfter(6);
        detailsCell.addElement(invoiceTitle);

        Paragraph shopName = new Paragraph(safe(shop.getName(), "Your Shop"), shopNameFont);
        detailsCell.addElement(shopName);

        if (notBlank(shop.getAddress())) {
            detailsCell.addElement(new Paragraph(shop.getAddress(), detailFont));
        }

        if (notBlank(shop.getMobile())) {
            detailsCell.addElement(new Paragraph("Phone: " + shop.getMobile(), detailFont));
        }

        if (notBlank(shop.getGstNumber())) {
            detailsCell.addElement(new Paragraph("GSTIN: " + shop.getGstNumber(), detailFont));
        }

        detailsCell.addElement(new Paragraph("Invoice No: " + generateInvoiceCode(shop, bill.getInvoiceNumber()), detailFont));

        headerTable.addCell(logoCell);
        headerTable.addCell(detailsCell);
        document.add(headerTable);

        Paragraph separator = new Paragraph(" ");
        separator.setSpacingAfter(4);
        document.add(separator);
    }

    private PdfPTable createDefaultLogoBadge() {
        Font badgeFont = new Font(Font.HELVETICA, 12, Font.BOLD, Color.WHITE);

        PdfPTable badgeTable = new PdfPTable(1);
        badgeTable.setTotalWidth(86);
        badgeTable.setLockedWidth(true);

        PdfPCell badgeCell = new PdfPCell(new Phrase("MY BILL", badgeFont));
        badgeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        badgeCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        badgeCell.setFixedHeight(52);
        badgeCell.setBackgroundColor(new Color(25, 84, 166));
        badgeCell.setBorderColor(new Color(25, 84, 166));

        badgeTable.addCell(badgeCell);
        return badgeTable;
    }

    private void addInvoiceMeta(Document document, Bill bill) throws DocumentException {
        Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, new Color(50, 50, 50));
        Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);

        PdfPTable infoTable = new PdfPTable(new float[]{1f, 1f, 1f, 1f});
        infoTable.setWidthPercentage(100);
        infoTable.setSpacingAfter(12);

        addMetaRow(infoTable, "Date", bill.getCreatedAt().format(INVOICE_DATE_FORMAT), labelFont, valueFont);
        addMetaRow(infoTable, "Customer", safe(bill.getCustomer().getName(), "-"), labelFont, valueFont);
        addMetaRow(infoTable, "Payment Status", safe(bill.getStatus(), "PENDING"), labelFont, valueFont);
        addMetaRow(infoTable, "Generated On", LocalDate.now().toString(), labelFont, valueFont);

        document.add(infoTable);
    }

    private void addMetaRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBackgroundColor(new Color(240, 244, 251));
        labelCell.setBorderColor(new Color(220, 227, 239));
        labelCell.setPadding(7);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorderColor(new Color(220, 227, 239));
        valueCell.setPadding(7);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addItemsTable(Document document, Bill bill) throws DocumentException {
        Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
        Font cellFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);

        PdfPTable table = new PdfPTable(new float[]{3.6f, 1f, 1.4f, 1.6f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(14);

        addHeaderCell(table, "Item", headerFont);
        addHeaderCell(table, "Qty", headerFont);
        addHeaderCell(table, "Price", headerFont);
        addHeaderCell(table, "Total", headerFont);

        List<BillItem> billItems = bill.getItems() != null ? bill.getItems() : new ArrayList<>();
        for (int i = 0; i < billItems.size(); i++) {
            BillItem item = billItems.get(i);
            Color rowBackground = i % 2 == 0 ? Color.WHITE : new Color(248, 250, 254);

            addBodyCell(table, safe(item.getProductName(), "-"), cellFont, Element.ALIGN_LEFT, rowBackground);
            addBodyCell(table, String.valueOf(item.getQuantity()), cellFont, Element.ALIGN_RIGHT, rowBackground);
            addBodyCell(table, inr(item.getPrice()), cellFont, Element.ALIGN_RIGHT, rowBackground);

            double lineTotal = nvl(item.getPrice()) * nvl(item.getQuantity());
            addBodyCell(table, inr(lineTotal), cellFont, Element.ALIGN_RIGHT, rowBackground);
        }

        document.add(table);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBackgroundColor(new Color(25, 84, 166));
        cell.setBorderColor(new Color(25, 84, 166));
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Font font, int align, Color background) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBackgroundColor(background);
        cell.setBorderColor(new Color(225, 231, 242));
        table.addCell(cell);
    }

    private void addTotals(Document document, Bill bill) throws DocumentException {
        Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, new Color(45, 45, 45));
        Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);
        Font balanceLabelFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(20, 63, 126));
        Font balanceValueFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(20, 63, 126));

        PdfPTable totalTable = new PdfPTable(new float[]{1.5f, 1f});
        totalTable.setWidthPercentage(44);
        totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.setSpacingAfter(14);

        double totalAmount = nvl(bill.getTotalAmount());
        double paidAmount = nvl(bill.getPaidAmount());
        double balance = totalAmount - paidAmount;

        addTotalRow(totalTable, "Total Amount", inr(totalAmount), labelFont, valueFont, Color.WHITE);
        addTotalRow(totalTable, "Paid Amount", inr(paidAmount), labelFont, valueFont, Color.WHITE);
        addTotalRow(totalTable, "Balance", inr(balance), balanceLabelFont, balanceValueFont, new Color(233, 241, 255));

        document.add(totalTable);
    }

    private void addTotalRow(
            PdfPTable table,
            String label,
            String value,
            Font labelFont,
            Font valueFont,
            Color background
    ) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setPadding(8);
        labelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        labelCell.setBackgroundColor(background);
        labelCell.setBorderColor(new Color(215, 223, 238));

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setPadding(8);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setBackgroundColor(background);
        valueCell.setBorderColor(new Color(215, 223, 238));

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addFooter(Document document) throws DocumentException {
        Font footerFont = new Font(Font.HELVETICA, 10, Font.ITALIC, new Color(90, 90, 90));
        Paragraph footer = new Paragraph("Thank you for your business.", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(4);
        document.add(footer);
    }

    private Image resolveLogo(Shop shop) {
        List<String> logoPaths = new ArrayList<>();

        if (shop != null && notBlank(shop.getLogoPath())) {
            logoPaths.add(shop.getLogoPath().trim());
        }

        logoPaths.add("uploads/logo.png");

        for (String path : logoPaths) {
            try {
                Path logoPath = Path.of(path);
                if (Files.exists(logoPath)) {
                    return Image.getInstance(logoPath.toAbsolutePath().toString());
                }
            } catch (Exception ignored) {
                // Move on to the next logo candidate.
            }
        }

        return null;
    }

    private String inr(Double amount) {
        return "Rs. " + MONEY.format(nvl(amount));
    }

    private double nvl(Number value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    private String safe(String value, String fallback) {
        return notBlank(value) ? value : fallback;
    }

    private boolean notBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String generateInvoiceCode(Shop shop,
                                       Long invoiceNumber) {

        String year = String.valueOf(
                LocalDate.now().getYear());

        String formattedNumber =
                String.format("%04d", invoiceNumber);

        return safe(shop.getInvoicePrefix(), "INV")
                + "-" + year
                + "-" + formattedNumber;
    }
}
