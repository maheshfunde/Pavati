package com.mybill.billing.service;

import com.lowagie.text.*;
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
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final BillRepository billRepository;
    private final SecurityUtils securityUtils;

    public byte[] generateInvoice(Long billId) throws Exception {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (!bill.getShop().getId()
                .equals(securityUtils.getCurrentShopId())) {
            throw new RuntimeException("Unauthorized");
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);

        PdfWriter.getInstance(document, out);
        document.open();

        Image logo = Image.getInstance("uploads/logo.png");
        logo.scaleToFit(120, 120);
        logo.setAlignment(Element.ALIGN_CENTER);
        document.add(logo);

        Shop shop = bill.getShop();

        // ---------- SHOP HEADER ----------
        Font headerFont = new Font(Font.HELVETICA, 18, Font.BOLD);

        Paragraph shopName =
                new Paragraph(shop.getName(), headerFont);
        shopName.setAlignment(Element.ALIGN_CENTER);
        document.add(shopName);

        document.add(new Paragraph(shop.getAddress()));
        document.add(new Paragraph("GST: " + shop.getGstNumber()));
        document.add(new Paragraph(" "));

        // ---------- INVOICE INFO ----------
        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);

        infoTable.addCell("Invoice No:");
        infoTable.addCell(String.valueOf(generateInvoiceCode(
                bill.getShop(),
                bill.getInvoiceNumber())));

        infoTable.addCell("Date:");
        infoTable.addCell(bill.getCreatedAt().toString());

        infoTable.addCell("Customer:");
        infoTable.addCell(bill.getCustomer().getName());

        document.add(infoTable);

        document.add(new Paragraph(" "));

        // ---------- ITEMS TABLE ----------
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);

        table.addCell("Item");
        table.addCell("Qty");
        table.addCell("Price");
        table.addCell("Total");

        for (BillItem item : bill.getItems()) {

            table.addCell(item.getProductName());
            table.addCell(item.getQuantity().toString());
            table.addCell(item.getPrice().toString());

            double total =
                    item.getPrice() * item.getQuantity();

            table.addCell(String.valueOf(total));
        }

        document.add(table);

        document.add(new Paragraph(" "));

        // ---------- TOTALS ----------
        PdfPTable totalTable = new PdfPTable(2);
        totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

        totalTable.addCell("Total Amount:");
        totalTable.addCell(bill.getTotalAmount().toString());

        totalTable.addCell("Paid Amount:");
        totalTable.addCell(bill.getPaidAmount().toString());

        double balance =
                bill.getTotalAmount() - bill.getPaidAmount();

        totalTable.addCell("Balance:");
        totalTable.addCell(String.valueOf(balance));

        document.add(totalTable);

        document.add(new Paragraph(" "));
        document.add(new Paragraph(
                "Thank you! Visit Again",
                new Font(Font.HELVETICA, 12, Font.BOLD)));

        document.close();

        return out.toByteArray();
    }
    private String generateInvoiceCode(Shop shop,
                                       Long invoiceNumber) {

        String year = String.valueOf(
                LocalDate.now().getYear());

        String formattedNumber =
                String.format("%04d", invoiceNumber);

        return shop.getInvoicePrefix()
                + "-" + year
                + "-" + formattedNumber;
    }
}
