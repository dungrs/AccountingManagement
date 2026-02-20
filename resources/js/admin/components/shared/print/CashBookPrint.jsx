import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const CashBookPrint = forwardRef(({ result, systems }, ref) => {
    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
        } catch (error) {
            return dateString;
        }
    };

    // Format số - dùng dấu chấm ngăn cách hàng nghìn
    const formatMoney = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const num = Number(value);
        if (isNaN(num)) return "";
        return Math.abs(num)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    if (!result || !result.data) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    const companyName = systems?.homepage_company || "CÔNG TY TNHH ABC";
    const companyAddress =
        systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
    const companyTaxCode = systems?.contact_tax_code || "0123456789";

    const thStyle = {
        border: "1px solid black",
        padding: "6px 4px",
        textAlign: "center",
        backgroundColor: "#f0f0f0",
        color: "#000000",
        fontWeight: "bold",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
    };

    const tdStyle = {
        border: "1px solid black",
        padding: "4px",
        color: "#000000",
        fontSize: "11px",
    };

    return (
        <div
            ref={ref}
            style={{
                width: "297mm",
                minHeight: "210mm",
                padding: "10mm 15mm",
                fontFamily: "Times New Roman, serif",
                fontSize: "13px",
                lineHeight: "1.4",
                backgroundColor: "#ffffff",
                color: "#000000",
            }}
        >
            {/* ─── Header ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                }}
            >
                <div style={{ width: "50%", fontSize: "13px" }}>
                    <p
                        style={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            margin: "0 0 4px 0",
                        }}
                    >
                        {companyName}
                    </p>
                    <p style={{ margin: "2px 0" }}>MST: {companyTaxCode}</p>
                    <p style={{ margin: "2px 0" }}>{companyAddress}</p>
                </div>
                <div
                    style={{
                        width: "45%",
                        fontSize: "12px",
                        textAlign: "right",
                    }}
                >
                    <p style={{ fontWeight: "bold", margin: "0" }}>
                        Mẫu số S07-DN
                    </p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        (Ban hành theo Thông tư số
                    </p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        200/2014/TT-BTC ngày 22/12/2014
                    </p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        của Bộ Tài Chính)
                    </p>
                </div>
            </div>

            {/* ─── Tiêu đề ─── */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <h1
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        margin: "0 0 8px 0",
                    }}
                >
                    SỔ QUỸ {result.payment_method_name?.toUpperCase()}
                </h1>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Tài khoản: {result.account_code} - {result.account_name}
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Tháng {result.month} - Năm {result.year}
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Từ ngày {result.period?.start_date} đến ngày{" "}
                    {result.period?.end_date}
                </p>
            </div>

            {/* ─── Dòng số dư đầu kỳ ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "8px",
                    fontSize: "13px",
                }}
            >
                <span style={{ fontWeight: "bold" }}>Số dư đầu kỳ: </span>
                <span style={{ fontWeight: "bold", marginLeft: "10px" }}>
                    {formatMoney(result.opening_balance || 0)}
                </span>
            </div>

            {/* ─── Bảng chính ─── */}
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    color: "#000000",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ ...thStyle, width: "10%" }}>Ngày CT</th>
                        <th style={{ ...thStyle, width: "12%" }}>Số CT</th>
                        <th style={{ ...thStyle, width: "38%" }}>Diễn giải</th>
                        <th style={{ ...thStyle, width: "13%" }}>Thu</th>
                        <th style={{ ...thStyle, width: "13%" }}>Chi</th>
                        <th style={{ ...thStyle, width: "14%" }}>Tồn</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Các dòng dữ liệu */}
                    {result.data.map((row, index) => {
                        const isOpeningRow = row.is_opening;

                        return (
                            <tr key={index}>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {row.voucher_date
                                        ? formatDate(row.voucher_date)
                                        : ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {row.code || ""}
                                </td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        fontWeight: isOpeningRow
                                            ? "bold"
                                            : "normal",
                                        fontStyle: isOpeningRow
                                            ? "italic"
                                            : "normal",
                                    }}
                                >
                                    {row.description}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {row.receipt_amount > 0
                                        ? formatMoney(row.receipt_amount)
                                        : ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {row.payment_amount > 0
                                        ? formatMoney(row.payment_amount)
                                        : ""}
                                </td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {formatMoney(row.balance)}
                                </td>
                            </tr>
                        );
                    })}

                    {/* ─── Dòng Tổng cộng ─── */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td
                            colSpan="3"
                            style={{
                                ...tdStyle,
                                textAlign: "center",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            Cộng phát sinh
                        </td>
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {formatMoney(result.summary?.total_receipt || 0)}
                        </td>
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {formatMoney(result.summary?.total_payment || 0)}
                        </td>
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {formatMoney(result.closing_balance || 0)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ─── Dòng số dư cuối kỳ ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                    fontSize: "13px",
                }}
            >
                <span style={{ fontWeight: "bold" }}>Số dư cuối kỳ: </span>
                <span style={{ fontWeight: "bold", marginLeft: "10px" }}>
                    {formatMoney(result.closing_balance || 0)}
                </span>
            </div>

            {/* ─── Ghi chú ─── */}
            <div style={{ marginTop: "16px", fontSize: "12px" }}>
                <p style={{ margin: "4px 0" }}>
                    Ngày mở sổ: {result.period?.start_date}
                </p>
            </div>

            {/* ─── Ngày ký ─── */}
            <div
                style={{
                    textAlign: "right",
                    marginTop: "24px",
                    marginBottom: "8px",
                    fontSize: "13px",
                }}
            >
                <p style={{ margin: 0 }}>
                    Ngày.......tháng.......năm.................
                </p>
            </div>

            {/* ─── Chữ ký ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginTop: "20px",
                }}
            >
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 60px 0" }}>
                        NGƯỜI GHI SỔ
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            margin: 0,
                        }}
                    >
                        (Ký, họ tên)
                    </p>
                </div>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 60px 0" }}>
                        KẾ TOÁN TRƯỞNG
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            margin: 0,
                        }}
                    >
                        (Ký, họ tên)
                    </p>
                </div>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 60px 0" }}>
                        NGƯỜI ĐẠI DIỆN THEO PHÁP LUẬT
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            margin: 0,
                        }}
                    >
                        (Ký, họ tên, đóng dấu)
                    </p>
                </div>
            </div>
        </div>
    );
});

CashBookPrint.displayName = "CashBookPrint";

export default CashBookPrint;