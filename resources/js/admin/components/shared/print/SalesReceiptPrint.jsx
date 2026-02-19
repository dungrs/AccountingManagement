import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const SalesReceiptPrint = forwardRef(
    ({ receipt, totals, user, customer, system_languages }, ref) => {
        const formatDate = (dateString) => {
            if (!dateString) return "";
            try {
                return format(new Date(dateString), "dd/MM/yyyy", {
                    locale: vi,
                });
            } catch {
                return dateString;
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

        const sys = system_languages || {};
        const companyName = sys.homepage_company || "";
        const officeAddress = sys.contact_office || "";
        const branchAddress = sys.contact_address || "";
        const hotline = sys.contact_hotline || "";
        const phone = sys.contact_phone || "";
        const email = sys.contact_email || "";
        const website = sys.contact_website || "";

        const formatDateFull = (dateString) => {
            if (!dateString) return "";
            try {
                const date = new Date(dateString);
                return `Ngày ${format(date, "dd", { locale: vi })} tháng ${format(date, "MM", { locale: vi })} năm ${format(date, "yyyy", { locale: vi })}`;
            } catch {
                return dateString;
            }
        };

        const numberToVietnameseText = (num) => {
            if (!num || num === 0) return "Không đồng";
            const units = ["", "nghìn", "triệu", "tỷ"];
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
                if (group > 0) {
                    result =
                        readGroup(group) +
                        " " +
                        units[unitIndex] +
                        " " +
                        result;
                }
                n = Math.floor(n / 1000);
                unitIndex++;
            }
            result = result.trim();
            return (
                result.charAt(0).toUpperCase() + result.slice(1) + " đồng chẵn."
            );
        };

        const getUnitName = (item) => {
            if (item.unit?.name) return item.unit.name;
            if (item.unit_name) return item.unit_name;
            return "Cái";
        };

        const getProductCode = (item) => {
            return item.sku || item.barcode || item.code || "";
        };

        const getTotalQuantity = () => {
            if (!receipt.product_variants?.length) return 0;
            return receipt.product_variants.reduce(
                (sum, item) => sum + (parseFloat(item.quantity) || 0),
                0,
            );
        };

        const getAmountBeforeVAT = (item) => {
            return (
                (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)
            );
        };

        const getTotalBeforeVAT = () => {
            if (!receipt.product_variants?.length) return 0;
            return receipt.product_variants.reduce(
                (sum, item) => sum + getAmountBeforeVAT(item),
                0,
            );
        };

        // Lấy tên khách hàng từ nhiều nguồn
        const customerName =
            customer?.name ||
            receipt.customer_info?.name ||
            receipt.customer_name ||
            "___________________________________";

        // Lấy địa chỉ (bộ phận) từ khách hàng
        const customerAddress =
            customer?.address ||
            receipt.customer_info?.address ||
            receipt.customer_address ||
            "___________________________________";

        return (
            <div
                ref={ref}
                className="bg-white text-black"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "15mm",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "13px",
                    lineHeight: "1.5",
                }}
            >
                {/* ─── Header ─── */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                    }}
                >
                    {/* Bên trái: thông tin đơn vị */}
                    <div style={{ width: "55%", fontSize: "12px" }}>
                        <p
                            style={{
                                fontWeight: "bold",
                                textTransform: "uppercase",
                            }}
                        >
                            {companyName || "______________________________"}
                        </p>
                        {officeAddress && <p>{officeAddress}</p>}
                        {branchAddress && <p>{branchAddress}</p>}
                        {(phone || hotline) && (
                            <p>
                                {phone && `ĐT: ${phone}`}
                                {phone && hotline ? " - " : ""}
                                {hotline && `Hotline: ${hotline}`}
                            </p>
                        )}
                        {email && <p>Email: {email}</p>}
                        {website && <p>Website: {website}</p>}
                    </div>

                    {/* Bên phải: mẫu số */}
                    <div
                        style={{
                            width: "40%",
                            fontSize: "12px",
                            textAlign: "right",
                        }}
                    >
                        <p style={{ fontWeight: "bold" }}>Mẫu số 02 - VT</p>
                        <p style={{ fontStyle: "italic", fontSize: "11px" }}>
                            (Ban hành theo Thông tư số 200/2014/TT-BTC
                        </p>
                        <p style={{ fontStyle: "italic", fontSize: "11px" }}>
                            Ngày 22/12/2014 của Bộ Tài chính)
                        </p>
                    </div>
                </div>

                {/* ─── Tiêu đề ─── */}
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    <h1
                        style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                        }}
                    >
                        PHIẾU XUẤT KHO
                    </h1>
                    <p style={{ fontStyle: "italic", marginBottom: "4px" }}>
                        {formatDateFull(receipt.receipt_date || new Date())}
                    </p>
                    <p>Số: {receipt.code || "___________"}</p>
                </div>

                {/* ─── Hạch toán ─── */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "12px",
                        fontSize: "12px",
                    }}
                >
                    <div style={{ textAlign: "right" }}>
                        <p>Nợ: 632</p>
                        <p>Có: 156</p>
                    </div>
                </div>

                {/* ─── Thông tin xuất kho ─── */}
                <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                    <div style={{ display: "flex", marginBottom: "4px" }}>
                        <span style={{ whiteSpace: "nowrap" }}>
                            - Họ và tên người nhận hàng:&nbsp;
                        </span>
                        <span
                            style={{
                                fontWeight: "bold",
                                textTransform: "uppercase",
                            }}
                        >
                            {customerName}
                        </span>
                        <span
                            style={{ whiteSpace: "nowrap", marginLeft: "20px" }}
                        >
                            Địa chỉ (bộ phận):&nbsp;
                        </span>
                        <span style={{ fontWeight: "bold" }}>
                            {customerAddress}
                        </span>
                    </div>

                    <p style={{ marginBottom: "4px" }}>
                        - Lý do xuất kho:{" "}
                        <span style={{ fontWeight: "bold" }}>
                            {receipt.note || receipt.reason || "Xuất bán"}
                        </span>
                    </p>

                    <div style={{ display: "flex", marginBottom: "4px" }}>
                        <span style={{ whiteSpace: "nowrap" }}>
                            - Xuất tại kho (ngăn lô):{" "}
                            <span style={{ fontWeight: "bold" }}>
                                {receipt.warehouse_name || "Hàng hoá"}
                            </span>
                        </span>
                        <span
                            style={{ marginLeft: "40px", whiteSpace: "nowrap" }}
                        >
                            Địa điểm:{" "}
                            <span style={{ fontWeight: "bold" }}>
                                {receipt.warehouse_location ||
                                    officeAddress ||
                                    "___________________"}
                            </span>
                        </span>
                    </div>
                </div>

                {/* ─── Bảng sản phẩm ─── */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "12px",
                        fontSize: "12px",
                        border: "1px solid black",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                rowSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "36px",
                                }}
                            >
                                STT
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                }}
                            >
                                Tên, nhãn hiệu, quy cách,
                                <br />
                                phẩm chất vật tư, dụng cụ
                                <br />
                                sp, hàng hoá
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "70px",
                                }}
                            >
                                Mã số
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "45px",
                                }}
                            >
                                ĐVT
                            </th>
                            <th
                                colSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                }}
                            >
                                Số lượng
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "90px",
                                }}
                            >
                                Đơn giá
                            </th>
                            <th
                                rowSpan={2}
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "100px",
                                }}
                            >
                                Thành tiền
                            </th>
                        </tr>
                        <tr>
                            <th
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "55px",
                                }}
                            >
                                Theo
                                <br />
                                chứng từ
                            </th>
                            <th
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    width: "55px",
                                }}
                            >
                                Thực xuất
                            </th>
                        </tr>
                        <tr>
                            {["A", "B", "C", "D", "1", "2", "3", "4"].map(
                                (h) => (
                                    <th
                                        key={h}
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "center",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {h}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.product_variants?.length > 0 ? (
                            receipt.product_variants.map((item, index) => (
                                <tr key={index}>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {index + 1}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                        }}
                                    >
                                        {item.name || item.product_name || ""}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {getProductCode(item)}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {getUnitName(item)}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {formatMoney(item.quantity || 0)}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {/* Thực xuất để trống để thủ kho điền tay */}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {formatMoney(item.price || 0)}
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid black",
                                            padding: "4px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {formatMoney(getAmountBeforeVAT(item))}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="8"
                                    style={{
                                        border: "1px solid black",
                                        padding: "8px",
                                        textAlign: "center",
                                    }}
                                >
                                    Chưa có sản phẩm
                                </td>
                            </tr>
                        )}

                        {/* Dòng Cộng */}
                        <tr>
                            <td
                                colSpan="4"
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                Cộng
                            </td>
                            <td
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                }}
                            >
                                x
                            </td>
                            <td
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                x
                            </td>
                            <td
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                x
                            </td>
                            <td
                                style={{
                                    border: "1px solid black",
                                    padding: "4px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                }}
                            >
                                {formatMoney(getTotalBeforeVAT())}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ─── Tổng tiền bằng chữ ─── */}
                <div style={{ marginBottom: "16px", fontSize: "13px" }}>
                    <p style={{ marginBottom: "4px" }}>
                        - Tổng số tiền (viết bằng chữ):{" "}
                        <span
                            style={{ fontStyle: "italic", fontWeight: "600" }}
                        >
                            {numberToVietnameseText(getTotalBeforeVAT())}
                        </span>
                    </p>
                    <p>
                        - Số chứng từ gốc kèm theo:{" "}
                        <span style={{ fontWeight: "bold" }}>
                            {receipt.invoice_number
                                ? `HĐ GTGT ${receipt.invoice_number}`
                                : "__________________________________"}
                        </span>
                    </p>
                </div>

                {/* ─── Ngày ký ─── */}
                <div
                    style={{
                        textAlign: "right",
                        marginBottom: "8px",
                        fontSize: "13px",
                    }}
                >
                    <p style={{ fontStyle: "italic" }}>
                        {formatDateFull(receipt.receipt_date || new Date())}
                    </p>
                </div>

                {/* ─── Chữ ký (5 cột theo mẫu) ─── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "8px",
                        textAlign: "center",
                        fontSize: "12px",
                    }}
                >
                    {[
                        { title: "Người lập", sub: "(Ký, họ tên)" },
                        { title: "Người nhận hàng", sub: "(Ký, họ tên)" },
                        { title: "Thủ kho", sub: "(Ký, họ tên)" },
                        {
                            title: "Kế toán trưởng",
                            sub: "(Hoặc bộ phận có nhu\ncầu xuất)",
                        },
                        { title: "Giám đốc", sub: "(Ký, họ tên)" },
                    ].map((col) => (
                        <div key={col.title}>
                            <p
                                style={{
                                    fontWeight: "bold",
                                    marginBottom: "4px",
                                }}
                            >
                                {col.title}
                            </p>
                            <p
                                style={{
                                    fontStyle: "italic",
                                    fontSize: "11px",
                                    whiteSpace: "pre-line",
                                    marginBottom: "64px",
                                }}
                            >
                                {col.sub}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    },
);

SalesReceiptPrint.displayName = "SalesReceiptPrint";

export default SalesReceiptPrint;