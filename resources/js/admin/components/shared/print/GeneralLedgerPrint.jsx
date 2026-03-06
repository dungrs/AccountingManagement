import React, { forwardRef } from "react";
import { formatNumber } from "@/admin/utils/helpers";

/**
 * GeneralLedgerPrint — Sổ cái của một tài khoản (Mẫu số S03b-DN)
 * Căn cứ pháp lý:
 *   • Thông tư 99/2025/TT-BTC ngày 27/10/2025 (hiệu lực 01/01/2026)
 *     thay thế Thông tư 200/2014/TT-BTC ngày 22/12/2014
 */
const GeneralLedgerPrint = forwardRef(({ result, systems }, ref) => {
    if (!result || !result.data) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    const companyName =
        systems?.homepage_company ||
        "CÔNG TY PHẦN MỀM QUẢN LÝ DOANH NGHIỆP (FAST)";
    const companyAddress =
        systems?.contact_address ||
        "Tầng 3, Tòa nhà CT1B - Khu VOV, Mễ Trì, Nam Từ Liêm, Hà Nội";
    const companyWebsite = systems?.contact_website || "www.fast.com.vn";

    const accountInfo = result.account || {
        code: "131",
        name: "Phải thu khách hàng",
        normal_balance: "debit",
    };
    const period = result.period || { start_date: "", end_date: "" };
    const openingBalance = result.opening_balance || 0;
    const closingBalance = result.closing_balance || 0;
    const summary = result.summary || { total_debit: 0, total_credit: 0 };
    const data = result.data || [];

    const displayFromDate = period.start_date || "01/01/2030";
    const displayToDate = period.end_date || "10/01/2030";
    const balanceTypeLabel =
        accountInfo.normal_balance === "debit" ? "Nợ" : "Có";
    const filteredData = data.filter((item) => !item.is_opening);
    const totalPages = 1;

    const baseStyle = {
        fontFamily: "Times New Roman, serif",
        fontSize: "11px",
        color: "#000",
    };

    const thStyle = {
        border: "1px solid black",
        padding: "3px 4px",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "11px",
        verticalAlign: "middle",
    };

    const tdStyle = {
        border: "1px solid black",
        padding: "3px 4px",
        fontSize: "11px",
        verticalAlign: "top",
        color: "#000",
    };

    return (
        <div
            ref={ref}
            style={{
                ...baseStyle,
                width: "297mm",
                minHeight: "210mm",
                padding: "8mm 12mm 8mm 20mm",
                backgroundColor: "#fff",
                boxSizing: "border-box",
            }}
        >
            {/* ─── Header ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                }}
            >
                <div style={{ fontSize: "11px", lineHeight: "1.5" }}>
                    <div style={{ fontWeight: "bold" }}>{companyName}</div>
                    <div>{companyAddress}</div>
                    <div>{companyWebsite}</div>
                </div>

                {/* Cột phải: cập nhật sang TT99/2025 */}
                <div
                    style={{
                        textAlign: "right",
                        fontSize: "11px",
                        lineHeight: "1.5",
                    }}
                >
                    <div>
                        <strong>Mẫu số S03b-DN</strong>
                    </div>
                    <div style={{ fontStyle: "italic" }}>
                        (Ban hành theo Thông tư số
                    </div>
                    <div style={{ fontStyle: "italic" }}>
                        99/2025/TT-BTC ngày 27/10/2025
                    </div>
                    <div style={{ fontStyle: "italic" }}>của Bộ Tài Chính)</div>
                </div>
            </div>

            {/* ─── Tiêu đề ─── */}
            <div style={{ textAlign: "center", margin: "8px 0 4px 0" }}>
                <div
                    style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                    }}
                >
                    SỔ CÁI CỦA MỘT TÀI KHOẢN
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Tài khoản: {accountInfo.code} - {accountInfo.name}
                </div>
                <div style={{ fontSize: "11px", marginTop: "2px" }}>
                    Từ ngày {displayFromDate} đến ngày {displayToDate}
                </div>
            </div>

            {/* ─── Số dư đầu kỳ ─── */}
            <div
                style={{
                    textAlign: "right",
                    fontSize: "11px",
                    marginBottom: "4px",
                }}
            >
                <strong>Số dư {balanceTypeLabel} đầu kỳ:</strong>&nbsp;&nbsp;
                <span style={{ fontWeight: "bold" }}>
                    {formatNumber(openingBalance)}
                </span>
            </div>

            {/* ─── Bảng chính ─── */}
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                }}
            >
                <thead>
                    <tr>
                        <th rowSpan={3} style={{ ...thStyle, width: "7%" }}>
                            Ngày
                            <br />
                            tháng ghi
                            <br />
                            sổ
                        </th>
                        <th colSpan={2} style={{ ...thStyle, width: "14%" }}>
                            Chứng từ
                        </th>
                        <th rowSpan={3} style={{ ...thStyle, width: "26%" }}>
                            Diễn giải
                        </th>
                        <th colSpan={2} style={{ ...thStyle, width: "14%" }}>
                            Nhật ký chung
                        </th>
                        <th rowSpan={3} style={{ ...thStyle, width: "7%" }}>
                            Tk đối ứng
                        </th>
                        <th colSpan={2} style={{ ...thStyle, width: "18%" }}>
                            Số phát sinh
                        </th>
                    </tr>
                    <tr>
                        <th rowSpan={2} style={{ ...thStyle, width: "7%" }}>
                            Số
                        </th>
                        <th rowSpan={2} style={{ ...thStyle, width: "7%" }}>
                            Ngày
                        </th>
                        <th rowSpan={2} style={{ ...thStyle, width: "7%" }}>
                            Trang số
                        </th>
                        <th rowSpan={2} style={{ ...thStyle, width: "7%" }}>
                            Stt dòng
                        </th>
                        <th rowSpan={2} style={{ ...thStyle, width: "9%" }}>
                            Nợ
                        </th>
                        <th rowSpan={2} style={{ ...thStyle, width: "9%" }}>
                            Có
                        </th>
                    </tr>
                    <tr>{/* Empty row for rowSpan alignment */}</tr>
                    <tr>
                        {["A", "B", "C", "D", "E", "G", "H", "1", "2"].map(
                            (n) => (
                                <th key={n} style={thStyle}>
                                    {n}
                                </th>
                            ),
                        )}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length > 0 ? (
                        filteredData.map((row, index) => (
                            <tr key={index}>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {row.entry_date || ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {row.reference_code || ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {row.entry_date || ""}
                                </td>
                                <td style={tdStyle}>
                                    {row.description || ""}
                                    {row.journal_code && (
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                color: "#555",
                                            }}
                                        >
                                            {" "}
                                            CT: {row.journal_code}
                                        </span>
                                    )}
                                </td>
                                <td
                                    style={{ ...tdStyle, textAlign: "center" }}
                                ></td>
                                <td
                                    style={{ ...tdStyle, textAlign: "center" }}
                                ></td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {row.contra_accounts?.length > 0
                                        ? row.contra_accounts
                                              .map((acc) => acc.code)
                                              .join(", ")
                                        : row.reference_type_label || ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {row.debit ? formatNumber(row.debit) : ""}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                    {row.credit ? formatNumber(row.credit) : ""}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={9}
                                style={{
                                    ...tdStyle,
                                    textAlign: "center",
                                    padding: "16px",
                                }}
                            >
                                Không có dữ liệu phát sinh trong kỳ
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ─── Footer ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "11px",
                }}
            >
                <div style={{ lineHeight: "1.8" }}>
                    <div>
                        Sổ này có {totalPages} trang, đánh số từ trang số 01 đến
                        trang {String(totalPages).padStart(2, "0")}
                    </div>
                    <div>Ngày mở sổ: {displayToDate}</div>
                </div>
                <div style={{ textAlign: "right", lineHeight: "1.8" }}>
                    <div>
                        <strong>Tổng phát sinh nợ:</strong>&nbsp;&nbsp;
                        <strong>{formatNumber(summary.total_debit)}</strong>
                    </div>
                    <div>
                        <strong>Tổng phát sinh có:</strong>&nbsp;&nbsp;
                        <strong>{formatNumber(summary.total_credit)}</strong>
                    </div>
                    <div>
                        <strong>Số dư {balanceTypeLabel} cuối kỳ:</strong>
                        &nbsp;&nbsp;
                        <strong>{formatNumber(closingBalance)}</strong>
                    </div>
                </div>
            </div>

            {/* ─── Ngày ký ─── */}
            <div
                style={{
                    textAlign: "right",
                    fontSize: "11px",
                    marginTop: "8px",
                }}
            >
                Ngày......tháng........năm...................
            </div>

            {/* ─── Chữ ký ─── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "11px",
                }}
            >
                <div style={{ textAlign: "center", width: "30%" }}>
                    <div style={{ fontWeight: "bold" }}>NGƯỜI GHI SỔ</div>
                    <div style={{ fontStyle: "italic", marginTop: "2px" }}>
                        (Ký, họ tên)
                    </div>
                    <div style={{ marginTop: "50px" }}></div>
                </div>
                <div style={{ textAlign: "center", width: "30%" }}>
                    <div style={{ fontWeight: "bold" }}>KẾ TOÁN TRƯỞNG</div>
                    <div style={{ fontStyle: "italic", marginTop: "2px" }}>
                        (Ký, họ tên)
                    </div>
                    <div style={{ marginTop: "50px" }}></div>
                </div>
                <div style={{ textAlign: "center", width: "36%" }}>
                    <div style={{ fontWeight: "bold" }}>
                        NGƯỜI ĐẠI DIỆN THEO PHÁP LUẬT
                    </div>
                    <div style={{ fontStyle: "italic", marginTop: "2px" }}>
                        (Ký, họ tên, đóng dấu)
                    </div>
                    <div style={{ marginTop: "50px" }}></div>
                </div>
            </div>
        </div>
    );
});

GeneralLedgerPrint.displayName = "GeneralLedgerPrint";

export default GeneralLedgerPrint;
