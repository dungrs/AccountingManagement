import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const CustomerDebtPrint = forwardRef(({ result, systems }, ref) => {
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

    if (!result || !result.transactions) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    // Lọc bỏ tài khoản 131, chỉ lấy tài khoản đối ứng
    const filteredTransactions = result.transactions.filter(
        (item) => !item.is_receivable_account,
    );

    // Tính running balance - TK 131 là tài khoản phải thu (bên Nợ)
    // Dư Nợ đầu kỳ + Phát sinh Nợ - Phát sinh Có = Dư Nợ cuối kỳ
    let runningBalance = result.opening_balance || 0;
    const processedJournalEntries = [];

    const transactionsWithBalance = filteredTransactions.map((item) => {
        if (!processedJournalEntries.includes(item.journal_entry_id)) {
            const receivableEntry = result.transactions.find(
                (t) =>
                    t.journal_entry_id === item.journal_entry_id &&
                    t.is_receivable_account,
            );

            if (receivableEntry) {
                // Nợ tăng dư Nợ, Có giảm dư Nợ
                runningBalance +=
                    receivableEntry.debit - receivableEntry.credit;
            }
            processedJournalEntries.push(item.journal_entry_id);
        }

        return {
            ...item,
            running_balance: runningBalance,
        };
    });

    // Số dư cuối kỳ = Dư đầu + Phát sinh Nợ - Phát sinh Có
    const closingBalance =
        (result.opening_balance || 0) +
        (result.summary?.total_debit || 0) -
        (result.summary?.total_credit || 0);

    const companyName = systems?.homepage_company || "CÔNG TY TNHH ABC";
    const companyAddress =
        systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
    const companyWebsite = systems?.contact_website || "www.company.com.vn";

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
                    <p style={{ margin: "2px 0" }}>{companyAddress}</p>
                    <p style={{ margin: "2px 0" }}>{companyWebsite}</p>
                </div>
                <div
                    style={{
                        width: "45%",
                        fontSize: "12px",
                        textAlign: "right",
                    }}
                >
                    <p style={{ fontWeight: "bold", margin: "0" }}>
                        Mẫu số S31-DN
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
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <h1
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        margin: "0 0 8px 0",
                    }}
                >
                    SỔ CHI TIẾT CÔNG NỢ
                </h1>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Tài khoản: 131 - Phải thu của khách hàng
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Khách hàng:{" "}
                    <strong>{result.customer?.customer_name}</strong>
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Địa chỉ: {result.customer?.address}
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Từ ngày {result.period?.start_date} đến ngày{" "}
                    {result.period?.end_date}
                </p>
            </div>

            <div
                style={{
                    textAlign: "right",
                    marginBottom: "8px",
                    fontSize: "13px",
                    color: "#000000",
                }}
            >
                <span style={{ fontWeight: "bold" }}>Số dư nợ đầu kỳ:</span>{" "}
                <span style={{ fontWeight: "bold" }}>
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
                        <th colSpan="2" style={{ ...thStyle, width: "18%" }}>
                            Chứng từ
                        </th>
                        <th rowSpan="2" style={{ ...thStyle, width: "30%" }}>
                            Diễn giải
                        </th>
                        <th rowSpan="2" style={{ ...thStyle, width: "8%" }}>
                            TK đối ứng
                        </th>
                        <th colSpan="2" style={{ ...thStyle }}>
                            Số phát sinh
                        </th>
                        {/* ✅ Tách rõ cột Dư Nợ / Dư Có */}
                        <th colSpan="2" style={{ ...thStyle }}>
                            Số dư
                        </th>
                    </tr>
                    <tr>
                        <th style={{ ...thStyle, width: "9%" }}>Ngày</th>
                        <th style={{ ...thStyle, width: "9%" }}>Số</th>
                        <th style={{ ...thStyle, width: "11%" }}>Nợ</th>
                        <th style={{ ...thStyle, width: "11%" }}>Có</th>
                        {/* ✅ TK 131 phải thu = dư Nợ, để cột Nợ trước */}
                        <th style={{ ...thStyle, width: "11%" }}>Nợ</th>
                        <th style={{ ...thStyle, width: "11%" }}>Có</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Các dòng phát sinh */}
                    {transactionsWithBalance.map((item, index) => (
                        <tr key={item.journal_entry_detail_id || index}>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                {item.formatted_date || formatDate(item.date)}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                {item.reference_code || ""}
                            </td>
                            <td style={{ ...tdStyle }}>
                                {item.reference_note || ""}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                {item.account_code || ""}
                            </td>
                            {/* Phát sinh Nợ */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.debit > 0 ? formatMoney(item.debit) : ""}
                            </td>
                            {/* Phát sinh Có */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.credit > 0
                                    ? formatMoney(item.credit)
                                    : ""}
                            </td>
                            {/* ✅ Số dư Nợ: hiển thị khi running_balance >= 0 */}
                            <td
                                style={{
                                    ...tdStyle,
                                    textAlign: "right",
                                    fontWeight: "500",
                                }}
                            >
                                {item.running_balance >= 0
                                    ? formatMoney(item.running_balance)
                                    : ""}
                            </td>
                            {/* ✅ Số dư Có: hiển thị khi running_balance < 0 (KH ứng trước) */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.running_balance < 0
                                    ? formatMoney(
                                          Math.abs(item.running_balance),
                                      )
                                    : ""}
                            </td>
                        </tr>
                    ))}

                    {/* ─── Dòng Tổng cộng ─── */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td
                            colSpan="4"
                            style={{
                                ...tdStyle,
                                textAlign: "center",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            Cộng phát sinh
                        </td>
                        {/* Tổng phát sinh Nợ */}
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {formatMoney(result.summary?.total_debit || 0)}
                        </td>
                        {/* Tổng phát sinh Có */}
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {formatMoney(result.summary?.total_credit || 0)}
                        </td>
                        {/* Số dư cuối kỳ - cột Nợ */}
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {closingBalance >= 0
                                ? formatMoney(closingBalance)
                                : ""}
                        </td>
                        {/* Số dư cuối kỳ - cột Có (KH ứng trước tiền) */}
                        <td
                            style={{
                                ...tdStyle,
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                fontWeight: "bold",
                            }}
                        >
                            {closingBalance < 0
                                ? formatMoney(Math.abs(closingBalance))
                                : ""}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ─── Ghi chú cuối ─── */}
            <div style={{ marginTop: "12px", fontSize: "12px" }}>
                <p style={{ margin: "4px 0" }}>
                    Ngày mở sổ: {result.period?.start_date}
                </p>
            </div>

            {/* ─── Ngày ký ─── */}
            <div
                style={{
                    textAlign: "right",
                    marginTop: "16px",
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

CustomerDebtPrint.displayName = "CustomerDebtPrint";

export default CustomerDebtPrint;
