import React, { forwardRef } from "react";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

const CustomerOverdueDebtPrint = forwardRef(
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

        const calculateDueDays = (transactionDate) => {
            if (!transactionDate) return 0;
            const dueDate = new Date(transactionDate);
            dueDate.setDate(dueDate.getDate() + 30); // Giả sử thời hạn 30 ngày
            const today = new Date();
            return differenceInDays(today, dueDate);
        };

        const getDueLevel = (days) => {
            return { label: "Quá hạn", color: "#ef4444" };
        };

        const companyName = systems?.homepage_company || "CÔNG TY TNHH ABC";
        const companyAddress =
            systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
        const companyTaxCode = systems?.contact_tax_code || "0123456789";

        const summary = {
            total_debt: data.reduce(
                (sum, item) => sum + (item.closing_balance || 0),
                0,
            ),
            overdue_debt: data.reduce((sum, item) => {
                const dueDays = calculateDueDays(item.last_transaction_date);
                return sum + (dueDays > 0 ? item.closing_balance || 0 : 0);
            }, 0),
            count_overdue: data.filter(
                (item) => calculateDueDays(item.last_transaction_date) > 0,
            ).length,
        };

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
                            Mẫu số S25-DN
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
                        BÁO CÁO CÔNG NỢ QUÁ HẠN
                    </h1>
                    <p style={{ fontSize: "13px", margin: "4px 0" }}>
                        Tính đến ngày {formatDate(new Date())}
                    </p>
                    <p
                        style={{
                            fontSize: "12px",
                            fontStyle: "italic",
                            margin: "4px 0",
                        }}
                    >
                        (Kỳ báo cáo: {formatDate(filters?.start_date)} -{" "}
                        {formatDate(filters?.end_date)})
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
                            <th style={thStyle} width="5%">
                                STT
                            </th>
                            <th style={thStyle} width="8%">
                                Mã KH
                            </th>
                            <th style={thStyle} width="20%">
                                Tên khách hàng
                            </th>
                            <th style={thStyle} width="10%">
                                Mã số thuế
                            </th>
                            <th style={thStyle} width="12%">
                                Điện thoại
                            </th>
                            <th style={thStyle} width="12%">
                                Ngày GD cuối
                            </th>
                            <th style={thStyle} width="12%">
                                Số dư công nợ
                            </th>
                            <th style={thStyle} width="12%">
                                Số ngày quá hạn
                            </th>
                            <th style={thStyle} width="15%">
                                Phân loại
                            </th>
                        </tr>
                        <tr>
                            {["A", "B", "C", "D", "E", "F", "1", "2", "3"].map(
                                (h) => (
                                    <th
                                        key={h}
                                        style={{ ...thStyle, fontSize: "10px" }}
                                    >
                                        {h}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((customer, index) => {
                            const dueDays = calculateDueDays(
                                customer.last_transaction_date,
                            );
                            const dueLevel = getDueLevel(dueDays);

                            return (
                                <tr key={customer.id}>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                        }}
                                    >
                                        {index + 1}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                        }}
                                    >
                                        {customer.customer_code}
                                    </td>
                                    <td style={tdStyle}>
                                        {customer.customer_name}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                        }}
                                    >
                                        {customer.tax_code || "-"}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                        }}
                                    >
                                        {customer.phone || "-"}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                        }}
                                    >
                                        {formatDate(
                                            customer.last_transaction_date,
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {formatMoney(customer.closing_balance)}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                        }}
                                    >
                                        {dueDays > 0 ? dueDays : "-"}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "center",
                                            color: dueLevel.color,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {dueLevel.label}
                                    </td>
                                </tr>
                            );
                        })}
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
                        <p>Người lập: Kế toán công nợ</p>
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

CustomerOverdueDebtPrint.displayName = "CustomerOverdueDebtPrint";
export default CustomerOverdueDebtPrint;