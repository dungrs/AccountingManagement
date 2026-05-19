import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const CustomerDebtSummaryPrint = forwardRef(
    ({ data, systems, filters }, ref) => {
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
                return "";
            const num = Number(value);
            if (isNaN(num)) return "";
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        };

        const companyName = systems?.homepage_company || "CÔNG TY TNHH ABC";
        const companyAddress =
            systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
        const companyTaxCode = systems?.contact_tax_code || "0123456789";

        // Tính tổng summary
        const summary = data.summary || {
            opening_balance: 0,
            total_debit: 0,
            total_credit: 0,
            closing_balance: 0,
        };

        // Style chung
        const thStyle = {
            border: "1px solid black",
            padding: "8px 4px",
            textAlign: "center",
            backgroundColor: "#f0f0f0",
            color: "#000000",
            fontWeight: "bold",
            fontSize: "12px",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
        };

        const tdStyle = {
            border: "1px solid black",
            padding: "6px 4px",
            fontSize: "11px",
            color: "#000000",
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
                {/* Header */}
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
                            Mẫu số S23-DN
                        </p>
                        <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                            (Ban hành theo Thông tư số 99/2025/TT-BTC
                        </p>
                        <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                            ngày 27/10/2025 của Bộ Tài Chính)
                        </p>
                    </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h1
                        style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            margin: "0 0 8px 0",
                        }}
                    >
                        BÁO CÁO TỔNG HỢP CÔNG NỢ PHẢI THU
                    </h1>
                    <p style={{ fontSize: "13px", margin: "4px 0" }}>
                        Tài khoản: 131 - Phải thu của khách hàng
                    </p>
                    <p style={{ fontSize: "13px", margin: "4px 0" }}>
                        Từ ngày {formatDate(filters?.start_date)} đến ngày{" "}
                        {formatDate(filters?.end_date)}
                    </p>
                    <p
                        style={{
                            fontSize: "12px",
                            fontStyle: "italic",
                            margin: "4px 0",
                        }}
                    >
                        Ngày in: {formatDate(new Date())}
                    </p>
                </div>

                {/* Main table */}
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                    }}
                >
                    <thead>
                        <tr>
                            <th style={thStyle} rowSpan={2} width="5%">
                                STT
                            </th>
                            <th style={thStyle} rowSpan={2} width="10%">
                                Mã KH
                            </th>
                            <th style={thStyle} rowSpan={2} width="20%">
                                Tên khách hàng
                            </th>
                            <th style={thStyle} rowSpan={2} width="12%">
                                Mã số thuế
                            </th>
                            <th style={thStyle} colSpan={2} width="20%">
                                Số dư đầu kỳ
                            </th>
                            <th style={thStyle} colSpan={2} width="20%">
                                Phát sinh trong kỳ
                            </th>
                            <th style={thStyle} colSpan={2} width="20%">
                                Số dư cuối kỳ
                            </th>
                        </tr>
                        <tr>
                            <th style={thStyle}>Nợ</th>
                            <th style={thStyle}>Có</th>
                            <th style={thStyle}>Nợ</th>
                            <th style={thStyle}>Có</th>
                            <th style={thStyle}>Nợ</th>
                            <th style={thStyle}>Có</th>
                        </tr>
                        <tr>
                            {[
                                "A",
                                "B",
                                "C",
                                "D",
                                "1",
                                "2",
                                "3",
                                "4",
                                "5",
                                "6",
                            ].map((h) => (
                                <th
                                    key={h}
                                    style={{ ...thStyle, fontSize: "10px" }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.data?.map((customer, index) => (
                            <tr key={customer.id}>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {index + 1}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {customer.customer_code}
                                </td>
                                <td style={tdStyle}>
                                    {customer.customer_name}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {customer.tax_code || "-"}
                                </td>

                                {/* Dư nợ đầu kỳ */}
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {customer.opening_balance >= 0
                                        ? formatMoney(customer.opening_balance)
                                        : ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {customer.opening_balance < 0
                                        ? formatMoney(
                                              Math.abs(
                                                  customer.opening_balance,
                                              ),
                                          )
                                        : ""}
                                </td>

                                {/* Phát sinh trong kỳ */}
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {formatMoney(customer.total_debit)}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {formatMoney(customer.total_credit)}
                                </td>

                                {/* Dư nợ cuối kỳ */}
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {customer.closing_balance >= 0
                                        ? formatMoney(customer.closing_balance)
                                        : ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {customer.closing_balance < 0
                                        ? formatMoney(
                                              Math.abs(
                                                  customer.closing_balance,
                                              ),
                                          )
                                        : ""}
                                </td>
                            </tr>
                        ))}

                        {/* Dòng tổng cộng */}
                        <tr
                            style={{
                                fontWeight: "bold",
                                backgroundColor: "#f0f0f0",
                            }}
                        >
                            <td
                                colSpan={4}
                                style={{ ...tdStyle, textAlign: "center" }}
                            >
                                Tổng cộng
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {formatMoney(
                                    summary.opening_balance >= 0
                                        ? summary.opening_balance
                                        : 0,
                                )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {formatMoney(
                                    summary.opening_balance < 0
                                        ? Math.abs(summary.opening_balance)
                                        : 0,
                                )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {formatMoney(summary.total_debit)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {formatMoney(summary.total_credit)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {formatMoney(
                                    summary.closing_balance >= 0
                                        ? summary.closing_balance
                                        : 0,
                                )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {formatMoney(
                                    summary.closing_balance < 0
                                        ? Math.abs(summary.closing_balance)
                                        : 0,
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer */}
                <div
                    style={{
                        marginTop: "20px",
                        fontSize: "11px",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <p>Ngày lập báo cáo: {formatDate(new Date())}</p>
                        <p>Người lập: Kế toán thanh toán</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ fontWeight: "bold", marginBottom: "40px" }}>
                            KẾ TOÁN TRƯỞNG
                        </p>
                        <p style={{ fontStyle: "italic", fontSize: "10px" }}>
                            (Ký, họ tên)
                        </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ fontWeight: "bold", marginBottom: "40px" }}>
                            TỔNG GIÁM ĐỐC
                        </p>
                        <p style={{ fontStyle: "italic", fontSize: "10px" }}>
                            (Ký, họ tên, đóng dấu)
                        </p>
                    </div>
                </div>
            </div>
        );
    },
);

CustomerDebtSummaryPrint.displayName = "CustomerDebtSummaryPrint";
export default CustomerDebtSummaryPrint;