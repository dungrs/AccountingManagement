import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * InvoiceVATPrint — Hóa đơn GTGT điện tử
 * Căn cứ pháp lý cập nhật:
 *   • Nghị định 123/2020/NĐ-CP
 *   • Nghị định 70/2025/NĐ-CP (sửa đổi NĐ123, hiệu lực 01/06/2025)
 *   • Thông tư 32/2025/TT-BTC  (thay thế TT78/2021, hiệu lực 01/06/2025)
 */
const InvoiceVATPrint = forwardRef(
    ({ receipt, totals, user, customer, system_languages }, ref) => {
        /* ── Helpers ── */
        const formatDate = (dateString) => {
            if (!dateString) return { day: "", month: "", year: "" };
            try {
                const d = new Date(dateString);
                return {
                    day: String(d.getDate()).padStart(2, "0"),
                    month: String(d.getMonth() + 1).padStart(2, "0"),
                    year: d.getFullYear(),
                    full: format(d, "dd/MM/yyyy", { locale: vi }),
                };
            } catch {
                return { day: "", month: "", year: "", full: dateString };
            }
        };

        const formatMoney = (value) => {
            if (value === null || value === undefined || value === "")
                return "0";
            const num = Number(value);
            if (isNaN(num)) return "0";
            return num.toLocaleString("vi-VN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
        };

        const numberToVietnameseText = (num) => {
            if (!num || num === 0) return "Không đồng";
            const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
            const digits = [
                "không",
                "một",
                "hai",
                "ba",
                "bốn",
                "năm",
                "sáu",
                "bảy",
                "tám",
                "chín",
            ];
            const readGroup = (group) => {
                if (group === 0) return "";
                let result = "";
                const hundred = Math.floor(group / 100);
                const ten = Math.floor((group % 100) / 10);
                const unit = group % 10;
                if (hundred > 0) {
                    result += digits[hundred] + " trăm ";
                    if (ten === 0 && unit !== 0) result += "linh ";
                }
                if (ten > 1) {
                    result += digits[ten] + " mươi ";
                    if (unit === 1) result += "mốt ";
                    else if (unit === 5) result += "lăm ";
                    else if (unit > 0) result += digits[unit] + " ";
                } else if (ten === 1) {
                    result += "mười ";
                    if (unit === 5) result += "lăm ";
                    else if (unit > 0) result += digits[unit] + " ";
                } else if (unit > 0) {
                    result += digits[unit] + " ";
                }
                return result.trim();
            };
            let n = Math.floor(num);
            if (n === 0) return "Không đồng";
            let result = "";
            let unitIndex = 0;
            while (n > 0) {
                const group = n % 1000;
                if (group > 0)
                    result =
                        readGroup(group) +
                        " " +
                        units[unitIndex] +
                        " " +
                        result;
                n = Math.floor(n / 1000);
                unitIndex++;
            }
            result = result.trim();
            return result.charAt(0).toUpperCase() + result.slice(1) + " đồng.";
        };

        /* ── Dữ liệu công ty ── */
        const sys = system_languages || {};
        const companyName = sys.homepage_company || "CÔNG TY TNHH ABC";
        const companyAddress =
            sys.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
        const taxCode = sys.contact_tax_code || "0123456789";
        const phone = sys.contact_phone || "";
        const email = sys.contact_email || "";

        /* ── Getters hàng hoá ── */
        const getUnitName = (item) =>
            item.unit?.name || item.unit_name || "Cái";
        const getProductName = (item) => item.name || item.product_name || "";
        const getAmount = (item) =>
            (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        const getVATAmount = (item) => parseFloat(item.vat_amount) || 0;

        const getTotalAmount = () =>
            receipt.product_variants?.reduce(
                (sum, item) => sum + getAmount(item),
                0,
            ) || 0;
        const getTotalVAT = () =>
            receipt.product_variants?.reduce(
                (sum, item) => sum + getVATAmount(item),
                0,
            ) || 0;

        const totalAmount = getTotalAmount();
        const totalVAT = getTotalVAT();
        const grandTotal = totalAmount + totalVAT;
        const discountAmount = parseFloat(
            receipt.discount_amount || receipt.discount_total || 0,
        );
        const finalTotal = grandTotal - discountAmount;

        /* ── Dữ liệu khách hàng ── */
        const customerName =
            customer?.name || receipt.customer_info?.name || "Khách lẻ";
        const customerTaxCode =
            customer?.tax_code || receipt.customer_info?.tax_code || "";
        const customerAddress =
            customer?.address || receipt.customer_info?.address || "";
        const customerBank = customer?.bank_account || "";

        const invoiceDate = formatDate(receipt.receipt_date);

        /* ── Ký hiệu hóa đơn theo TT32/2025 ──
         * Cấu trúc 6 ký tự: [Mẫu số][C/K][YY][Loại][XX]
         * Mẫu số 1 = HĐGTGT; C = có mã CQT; YY = 2 số cuối năm; T = doanh nghiệp thông thường
         * Ví dụ năm 2026: 1C26TAA
         */
        const invoiceYear2Digit = invoiceDate.year
            ? String(invoiceDate.year).slice(-2)
            : String(new Date().getFullYear()).slice(-2);
        const invoiceSymbol = `1C${invoiceYear2Digit}TAA`; // ký hiệu chuẩn TT32/2025

        const paymentMethodText =
            receipt.payment_method === "cash"
                ? "Tiền mặt"
                : receipt.payment_method === "bank"
                  ? "Chuyển khoản"
                  : receipt.payment_method === "both"
                    ? "Tiền mặt & Chuyển khoản"
                    : "Tiền mặt";

        /* ── Styles inline ── */
        const thStyle = {
            border: "1px solid #000",
            padding: "5px 6px",
            textAlign: "center",
            backgroundColor: "#f5f5f5",
            fontWeight: "bold",
            fontSize: "12px",
        };
        const tdStyle = (align = "left") => ({
            border: "1px solid #000",
            padding: "4px 6px",
            textAlign: align,
            fontSize: "12px",
            verticalAlign: "top",
        });

        /* ── Render ── */
        return (
            <div
                ref={ref}
                className="bg-white text-black"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "12mm 14mm",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    color: "#000",
                }}
            >
                {/* ── Căn cứ pháp lý (cập nhật TT32/2025 + NĐ70/2025) ── */}
                <div
                    style={{
                        fontSize: "10px",
                        color: "#555",
                        marginBottom: "6px",
                        textAlign: "right",
                    }}
                >
                    Căn cứ Nghị định 123/2020/NĐ-CP, Nghị định 70/2025/NĐ-CP và
                    Thông tư 32/2025/TT-BTC
                </div>

                {/* ── Header 2 cột ── */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                    }}
                >
                    {/* Cột trái: Đơn vị bán */}
                    <div style={{ flex: 1, paddingRight: "20px" }}>
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "15px",
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >
                            {companyName}
                        </div>
                        <div style={{ fontSize: "12px" }}>
                            MST: <strong>{taxCode}</strong>
                        </div>
                        <div style={{ fontSize: "12px" }}>
                            Địa chỉ: {companyAddress}
                        </div>
                        {phone && (
                            <div style={{ fontSize: "12px" }}>
                                Điện thoại: {phone}
                            </div>
                        )}
                        {email && (
                            <div style={{ fontSize: "12px" }}>
                                Email: {email}
                            </div>
                        )}
                    </div>

                    {/* Cột phải: Mã CQT + ký hiệu + số */}
                    <div
                        style={{
                            width: "190px",
                            border: "1px solid #000",
                            padding: "8px 10px",
                            fontSize: "11px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: "bold",
                                marginBottom: "4px",
                                fontSize: "12px",
                            }}
                        >
                            MÃ CỦA CQT
                        </div>
                        <div
                            style={{
                                border: "1px solid #000",
                                minHeight: "36px",
                                marginBottom: "6px",
                                padding: "4px",
                                letterSpacing: "2px",
                                fontSize: "11px",
                                wordBreak: "break-all",
                            }}
                        >
                            {receipt.tax_authority_code || ""}
                        </div>
                        {/* Ký hiệu mẫu số theo khoản 1 Điều 5 TT32/2025 */}
                        <div style={{ fontSize: "11px" }}>
                            Ký hiệu mẫu số: <strong>{invoiceSymbol}</strong>
                        </div>
                        <div style={{ fontSize: "11px" }}>
                            Số:{" "}
                            <strong>
                                {String(receipt.code || "1").padStart(8, "0")}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* ── Tiêu đề hóa đơn ── */}
                <div style={{ textAlign: "center", marginBottom: "6px" }}>
                    <div
                        style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                        }}
                    >
                        HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            fontStyle: "italic",
                            marginTop: "2px",
                        }}
                    >
                        (Bản thể hiện của hóa đơn điện tử)
                    </div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>
                        Ngày <strong>{invoiceDate.day}</strong> tháng{" "}
                        <strong>{invoiceDate.month}</strong> năm{" "}
                        <strong>{invoiceDate.year}</strong>
                    </div>
                </div>

                {/* ── Thông tin người mua ── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "12px",
                        fontSize: "12px",
                    }}
                >
                    <tbody>
                        <tr>
                            <td
                                style={{
                                    width: "160px",
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Họ tên người mua hàng:
                            </td>
                            <td style={{ paddingBottom: "3px" }}>
                                {customerName}
                            </td>
                            <td
                                style={{
                                    width: "130px",
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Hình thức TT:
                            </td>
                            <td style={{ paddingBottom: "3px" }}>
                                {paymentMethodText}
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Tên đơn vị:
                            </td>
                            <td style={{ paddingBottom: "3px" }}>
                                {customer?.company_name || ""}
                            </td>
                            <td
                                style={{
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Mã số thuế:
                            </td>
                            <td style={{ paddingBottom: "3px" }}>
                                {customerTaxCode || ""}
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Địa chỉ:
                            </td>
                            <td colSpan="3" style={{ paddingBottom: "3px" }}>
                                {customerAddress || ""}
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Số tài khoản:
                            </td>
                            <td style={{ paddingBottom: "3px" }}>
                                {customerBank || ""}
                            </td>
                            <td
                                style={{
                                    fontWeight: "bold",
                                    paddingBottom: "3px",
                                }}
                            >
                                Tại ngân hàng:
                            </td>
                            <td style={{ paddingBottom: "3px" }}>
                                {customer?.bank_name || ""}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── Bảng hàng hóa ── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "10px",
                        fontSize: "12px",
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: "30px" }}>STT</th>
                            <th style={thStyle}>Tên hàng hóa, dịch vụ</th>
                            <th style={{ ...thStyle, width: "45px" }}>ĐVT</th>
                            <th style={{ ...thStyle, width: "55px" }}>
                                Số lượng
                            </th>
                            <th style={{ ...thStyle, width: "90px" }}>
                                Đơn giá
                            </th>
                            <th style={{ ...thStyle, width: "100px" }}>
                                Thành tiền
                                <br />
                                <span
                                    style={{
                                        fontWeight: "normal",
                                        fontSize: "10px",
                                    }}
                                >
                                    (chưa thuế)
                                </span>
                            </th>
                            <th style={{ ...thStyle, width: "55px" }}>
                                Thuế suất GTGT
                            </th>
                            <th style={{ ...thStyle, width: "95px" }}>
                                Tiền thuế GTGT
                            </th>
                        </tr>
                        <tr>
                            {["1", "2", "3", "4", "5", "6", "7", "8"].map(
                                (n) => (
                                    <td
                                        key={n}
                                        style={{
                                            ...tdStyle("center"),
                                            backgroundColor: "#f5f5f5",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {n}
                                    </td>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.product_variants?.length > 0 ? (
                            receipt.product_variants.map((item, index) => {
                                const amount = getAmount(item);
                                const vatAmount = getVATAmount(item);
                                const vatRate = item.vat_rate ?? 10;
                                return (
                                    <tr key={index}>
                                        <td style={tdStyle("center")}>
                                            {index + 1}
                                        </td>
                                        <td style={tdStyle("left")}>
                                            {getProductName(item)}
                                        </td>
                                        <td style={tdStyle("center")}>
                                            {getUnitName(item)}
                                        </td>
                                        <td style={tdStyle("right")}>
                                            {formatMoney(item.quantity || 0)}
                                        </td>
                                        <td style={tdStyle("right")}>
                                            {formatMoney(item.price || 0)}
                                        </td>
                                        <td style={tdStyle("right")}>
                                            {formatMoney(amount)}
                                        </td>
                                        <td style={tdStyle("center")}>
                                            {vatRate}%
                                        </td>
                                        <td style={tdStyle("right")}>
                                            {formatMoney(vatAmount)}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" style={tdStyle("center")}>
                                    Không có dữ liệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* ── Phần tổng kết ── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "10px",
                        fontSize: "13px",
                    }}
                >
                    <tbody>
                        <tr>
                            <td
                                style={{
                                    border: "1px solid #000",
                                    padding: "5px 8px",
                                    fontWeight: "bold",
                                    width: "60%",
                                }}
                            >
                                Cộng tiền hàng (chưa có thuế GTGT):
                            </td>
                            <td
                                style={{
                                    border: "1px solid #000",
                                    padding: "5px 8px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                }}
                            >
                                {formatMoney(totalAmount)}
                            </td>
                        </tr>

                        {discountAmount > 0 && (
                            <tr>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px 8px",
                                    }}
                                >
                                    Chiết khấu thương mại:
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px 8px",
                                        textAlign: "right",
                                        color: "red",
                                    }}
                                >
                                    - {formatMoney(discountAmount)}
                                </td>
                            </tr>
                        )}

                        <tr>
                            <td
                                style={{
                                    border: "1px solid #000",
                                    padding: "5px 8px",
                                }}
                            >
                                Thuế suất GTGT:{" "}
                                {[
                                    ...new Set(
                                        receipt.product_variants?.map(
                                            (i) => i.vat_rate ?? 10,
                                        ),
                                    ),
                                ].join(", ")}
                                % &nbsp;&nbsp;—&nbsp;&nbsp; Tiền thuế GTGT:
                            </td>
                            <td
                                style={{
                                    border: "1px solid #000",
                                    padding: "5px 8px",
                                    textAlign: "right",
                                }}
                            >
                                {formatMoney(totalVAT)}
                            </td>
                        </tr>

                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <td
                                style={{
                                    border: "1px solid #000",
                                    padding: "6px 8px",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                }}
                            >
                                Tổng tiền thanh toán (đã có thuế GTGT):
                            </td>
                            <td
                                style={{
                                    border: "1px solid #000",
                                    padding: "6px 8px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    color: "#00008B",
                                }}
                            >
                                {formatMoney(finalTotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── Số tiền bằng chữ ── */}
                <div
                    style={{
                        marginBottom: "14px",
                        fontSize: "13px",
                        borderBottom: "1px dashed #aaa",
                        paddingBottom: "8px",
                    }}
                >
                    <span style={{ fontWeight: "bold" }}>
                        Số tiền viết bằng chữ:{" "}
                    </span>
                    <span style={{ fontStyle: "italic" }}>
                        {numberToVietnameseText(finalTotal)}
                    </span>
                </div>

                {/* ── Chữ ký ── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                        textAlign: "center",
                        fontSize: "12px",
                        marginTop: "10px",
                    }}
                >
                    <div>
                        <div
                            style={{ fontWeight: "bold", marginBottom: "2px" }}
                        >
                            NGƯỜI MUA HÀNG
                        </div>
                        <div
                            style={{
                                fontStyle: "italic",
                                fontSize: "11px",
                                marginBottom: "4px",
                            }}
                        >
                            (Ký, ghi rõ họ tên)
                        </div>
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#555",
                                marginBottom: "50px",
                            }}
                        >
                            (Chữ ký số / Ký điện tử)
                        </div>
                        <div
                            style={{
                                borderTop: "1px solid #000",
                                paddingTop: "4px",
                            }}
                        >
                            {customerName}
                        </div>
                    </div>

                    <div>
                        <div
                            style={{ fontWeight: "bold", marginBottom: "2px" }}
                        >
                            NGƯỜI BÁN HÀNG
                        </div>
                        <div
                            style={{
                                fontStyle: "italic",
                                fontSize: "11px",
                                marginBottom: "4px",
                            }}
                        >
                            (Ký, ghi rõ họ tên, đóng dấu)
                        </div>
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#555",
                                marginBottom: "50px",
                            }}
                        >
                            (Chữ ký số của doanh nghiệp)
                        </div>
                        <div
                            style={{
                                borderTop: "1px solid #000",
                                paddingTop: "4px",
                            }}
                        >
                            {companyName}
                        </div>
                    </div>
                </div>

                {/* ── Ghi chú cuối (cập nhật TT32/2025 + NĐ70/2025) ── */}
                <div
                    style={{
                        marginTop: "16px",
                        fontSize: "10px",
                        color: "#666",
                        textAlign: "center",
                        borderTop: "1px solid #ccc",
                        paddingTop: "6px",
                    }}
                >
                    <p>
                        Hóa đơn điện tử được lập theo Nghị định 123/2020/NĐ-CP
                        (sửa đổi bởi Nghị định 70/2025/NĐ-CP) và Thông tư
                        32/2025/TT-BTC
                    </p>
                    <p>
                        Tra cứu hóa đơn tại:{" "}
                        <strong>https://hoadondientu.gdt.gov.vn</strong>
                    </p>
                </div>
            </div>
        );
    },
);

InvoiceVATPrint.displayName = "InvoiceVATPrint";

export default InvoiceVATPrint;