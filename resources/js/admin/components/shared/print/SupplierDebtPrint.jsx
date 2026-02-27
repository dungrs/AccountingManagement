import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const SupplierDebtPrint = forwardRef(({ result, systems }, ref) => {
    // Format date safely
    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), "dd/MM/yyyy", {
                locale: vi,
            });
        } catch (error) {
            return dateString;
        }
    };

    // Format money - sử dụng dấu chấm như trong ảnh mẫu
    const formatMoney = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const num = Number(value);
        if (isNaN(num)) return "";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Kiểm tra dữ liệu
    if (!result || !result.transactions) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    // Thay thế phần filteredTransactions và transactionsWithBalance
    const groupedTransactions = React.useMemo(() => {
        const nonPayable = result.transactions.filter(
            (item) => !item.is_payable_account,
        );

        // Group theo reference_code + account_code để tránh duplicate
        const groupMap = new Map();
        nonPayable.forEach((item) => {
            const key = `${item.formatted_date}_${item.reference_code}_${item.reference_type_label}_${item.account_code}`;
            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    ...item,
                    debit: Number(item.debit) || 0,
                    credit: Number(item.credit) || 0,
                });
            } else {
                const existing = groupMap.get(key);
                existing.debit += Number(item.debit) || 0;
                existing.credit += Number(item.credit) || 0;
            }
        });

        return Array.from(groupMap.values()).sort(
            (a, b) => a.sort_key?.localeCompare(b.sort_key ?? "") ?? 0,
        );
    }, [result.transactions]);

    // Tính running balance trên grouped data
    let runningBalance = result.opening_balance || 0;
    const transactionsWithBalance = groupedTransactions.map((item) => {
        const debitAmount = Number(item.debit) || 0;
        const creditAmount = Number(item.credit) || 0;
        runningBalance = runningBalance + (debitAmount - creditAmount);
        return { ...item, running_balance: runningBalance };
    });

    // Tính số dư cuối kỳ
    const closingBalance =
        (result.opening_balance || 0) +
        (result.summary?.total_credit || 0) -
        (result.summary?.total_debit || 0);

    const companyName = systems?.homepage_company || "CÔNG TY TNHH ABC";
    const companyAddress =
        systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
    const companyWebsite = systems?.contact_website || "www.company.com.vn";

    // Style chung cho th
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
                            color: "#000000",
                        }}
                    >
                        {companyName}
                    </p>
                    <p style={{ margin: "2px 0", color: "#000000" }}>
                        {companyAddress}
                    </p>
                    <p style={{ margin: "2px 0", color: "#000000" }}>
                        {companyWebsite}
                    </p>
                </div>

                <div
                    style={{
                        width: "45%",
                        fontSize: "12px",
                        textAlign: "right",
                    }}
                >
                    <p
                        style={{
                            fontWeight: "bold",
                            margin: "0",
                            color: "#000000",
                        }}
                    >
                        Mẫu số S31-DN
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            margin: "2px 0",
                            color: "#000000",
                        }}
                    >
                        (Ban hành theo Thông tư số
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            margin: "2px 0",
                            color: "#000000",
                        }}
                    >
                        200/2014/TT-BTC ngày 22/12/2014
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            margin: "2px 0",
                            color: "#000000",
                        }}
                    >
                        của Bộ Tài Chính)
                    </p>
                </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <h1
                    style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        margin: "0 0 8px 0",
                        color: "#000000",
                    }}
                >
                    SỔ CHI TIẾT CÔNG NỢ
                </h1>
                <p
                    style={{
                        fontSize: "13px",
                        margin: "4px 0",
                        color: "#000000",
                    }}
                >
                    Tài khoản: 331 - Phải trả cho người bán
                </p>
                <p
                    style={{
                        fontSize: "13px",
                        margin: "4px 0",
                        color: "#000000",
                    }}
                >
                    Khách hàng: {result.supplier?.supplier_code} -{" "}
                    {result.supplier?.name}
                </p>
                <p
                    style={{
                        fontSize: "13px",
                        margin: "4px 0",
                        color: "#000000",
                    }}
                >
                    Từ ngày {result.period?.start_date} đến ngày{" "}
                    {result.period?.end_date}
                </p>
            </div>

            {/* Số dư đầu kỳ - góc phải, theo đúng mẫu */}
            <div
                style={{
                    textAlign: "right",
                    marginBottom: "8px",
                    fontSize: "13px",
                    color: "#000000",
                }}
            >
                <span>Số dư có đầu kỳ:</span>{" "}
                <span style={{ fontWeight: "bold", marginLeft: "40px" }}>
                    {formatMoney(result.opening_balance || 0)}
                </span>
            </div>

            {/* Main table */}
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
                            Tk đối ứng
                        </th>
                        <th colSpan="2" style={{ ...thStyle }}>
                            Số phát sinh
                        </th>
                        <th colSpan="2" style={{ ...thStyle }}>
                            Số dư
                        </th>
                    </tr>
                    <tr>
                        <th style={{ ...thStyle, width: "9%" }}>Ngày</th>
                        <th style={{ ...thStyle, width: "9%" }}>Số</th>
                        <th style={{ ...thStyle, width: "11%" }}>Nợ</th>
                        <th style={{ ...thStyle, width: "11%" }}>Có</th>
                        <th style={{ ...thStyle, width: "11%" }}>Nợ</th>
                        <th style={{ ...thStyle, width: "11%" }}>Có</th>
                    </tr>
                </thead>
                <tbody>
                    {transactionsWithBalance.map((item, index) => (
                        <tr key={`${item.reference_code}_${item.account_code}_${index}`}>
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
                            {/* Nợ phát sinh */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.debit > 0 ? formatMoney(item.debit) : ""}
                            </td>
                            {/* Có phát sinh */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.credit > 0
                                    ? formatMoney(item.credit)
                                    : ""}
                            </td>
                            {/* Số dư Nợ: khi running_balance < 0 (dư Nợ) */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.running_balance < 0
                                    ? formatMoney(
                                          Math.abs(item.running_balance),
                                      )
                                    : ""}
                            </td>
                            {/* Số dư Có: khi running_balance >= 0 (dư Có) */}
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                {item.running_balance >= 0
                                    ? formatMoney(item.running_balance)
                                    : ""}
                            </td>
                        </tr>
                    ))}

                    {/* Total row */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td
                            colSpan="4"
                            style={{
                                border: "1px solid black",
                                padding: "6px 4px",
                                textAlign: "center",
                                backgroundColor: "#e9e9e9",
                                color: "#000000",
                                fontWeight: "bold",
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                            }}
                        >
                            Tổng cộng
                        </td>
                        <td
                            style={{
                                border: "1px solid black",
                                padding: "6px 4px",
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                color: "#000000",
                                fontWeight: "bold",
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                            }}
                        >
                            {formatMoney(result.summary?.total_debit || 0)}
                        </td>
                        <td
                            style={{
                                border: "1px solid black",
                                padding: "6px 4px",
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                color: "#000000",
                                fontWeight: "bold",
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                            }}
                        >
                            {formatMoney(result.summary?.total_credit || 0)}
                        </td>
                        {/* Tổng Số dư Nợ cuối kỳ */}
                        <td
                            style={{
                                border: "1px solid black",
                                padding: "6px 4px",
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                color: "#000000",
                                fontWeight: "bold",
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                            }}
                        >
                            {closingBalance < 0
                                ? formatMoney(Math.abs(closingBalance))
                                : "0"}
                        </td>
                        {/* Tổng Số dư Có cuối kỳ */}
                        <td
                            style={{
                                border: "1px solid black",
                                padding: "6px 4px",
                                textAlign: "right",
                                backgroundColor: "#e9e9e9",
                                color: "#000000",
                                fontWeight: "bold",
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                            }}
                        >
                            {closingBalance >= 0
                                ? formatMoney(closingBalance)
                                : ""}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer note - theo mẫu */}
            <div
                style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#000000",
                }}
            >
                <p style={{ margin: "4px 0" }}>
                    Sổ này có 01 trang, đánh số từ trang sổ 01 đến trang 01
                </p>
                <p style={{ margin: "4px 0" }}>
                    Ngày mở sổ: {result.period?.end_date}
                </p>
            </div>

            {/* Signature date - bên phải theo mẫu */}
            <div
                style={{
                    textAlign: "right",
                    fontSize: "13px",
                    marginTop: "8px",
                }}
            >
                <p style={{ margin: "0 0 8px 0", color: "#000000" }}>
                    Ngày.......tháng.......năm.................
                </p>
            </div>

            {/* Signatures */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: "#000000",
                }}
            >
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p
                        style={{
                            fontWeight: "bold",
                            margin: "0 0 60px 0",
                            color: "#000000",
                        }}
                    >
                        NGƯỜI GHI SỔ
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            margin: 0,
                            color: "#000000",
                        }}
                    >
                        (Ký, họ tên)
                    </p>
                </div>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p
                        style={{
                            fontWeight: "bold",
                            margin: "0 0 60px 0",
                            color: "#000000",
                        }}
                    >
                        KẾ TOÁN TRƯỞNG
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            margin: 0,
                            color: "#000000",
                        }}
                    >
                        (Ký, họ tên)
                    </p>
                </div>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p
                        style={{
                            fontWeight: "bold",
                            margin: "0 0 60px 0",
                            color: "#000000",
                        }}
                    >
                        NGƯỜI ĐẠI DIỆN THEO PHÁP LUẬT
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            margin: 0,
                            color: "#000000",
                        }}
                    >
                        (Ký, họ tên, đóng dấu)
                    </p>
                </div>
            </div>
        </div>
    );
});

SupplierDebtPrint.displayName = "SupplierDebtPrint";

export default SupplierDebtPrint;
