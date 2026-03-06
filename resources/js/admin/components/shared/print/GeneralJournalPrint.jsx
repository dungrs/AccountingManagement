import React, { forwardRef } from "react";

const GeneralJournalPrint = forwardRef(({ data, systems }, ref) => {
    const formatMoney = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const num = Number(value);
        if (isNaN(num) || num === 0) return "";
        return Math.abs(num)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    if (!data || !data.data) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    const companyName =
        systems?.homepage_company || "Công ty TNHH Thương Mại Sản Xuất HN";
    const companyAddress =
        systems?.contact_address ||
        "125 Lê Đức Thọ - Mỹ Đình - Nam Từ Liêm - Hà Nội";

    const totalDebit = data.data.reduce(
        (sum, row) => sum + (row.so_tien_no || 0),
        0,
    );
    const totalCredit = data.data.reduce(
        (sum, row) => sum + (row.so_tien_co || 0),
        0,
    );

    /* ── Styles ── */
    const base = {
        fontFamily: "Times New Roman, serif",
        fontSize: "11px",
        color: "#000",
    };

    const cell = {
        border: "1px solid #000",
        padding: "3px 4px",
        verticalAlign: "middle",
        color: "#000",
        fontSize: "11px",
    };

    const thCell = {
        ...cell,
        textAlign: "center",
        fontWeight: "bold",
        backgroundColor: "#fff",
    };

    const labelRow = {
        ...cell,
        textAlign: "center",
        fontWeight: "normal",
        backgroundColor: "#fff",
        fontSize: "10px",
        color: "#444",
    };

    return (
        <div
            ref={ref}
            style={{
                ...base,
                width: "297mm",
                minHeight: "210mm",
                padding: "10mm 15mm",
                backgroundColor: "#fff",
                boxSizing: "border-box",
            }}
        >
            {/* ── Header: Đơn vị + Mẫu số ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                }}
            >
                <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                        Đơn vị: {companyName}
                    </p>
                    <p style={{ margin: 0 }}>Địa chỉ: {companyAddress}</p>
                </div>
                {/* CẬP NHẬT THEO TT99/2025/TT-BTC */}
                <div
                    style={{
                        textAlign: "right",
                        fontSize: "11px",
                        lineHeight: "1.6",
                    }}
                >
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                        Mẫu số S03a-DN
                    </p>
                    <p style={{ margin: 0, fontStyle: "italic" }}>
                        (Ban hành theo Thông tư số 99/2025/TT-BTC
                    </p>
                    <p style={{ margin: 0, fontStyle: "italic" }}>
                        Ngày 27/10/2025 của Bộ Tài chính)
                    </p>
                </div>
            </div>

            {/* ── Tiêu đề ── */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "4px",
                    lineHeight: "1.8",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                    }}
                >
                    Sổ Nhật Ký Chung
                </h2>
                <p style={{ margin: 0, fontSize: "12px" }}>
                    {data.period?.start_date && data.period?.end_date
                        ? `Từ ngày ${data.period.start_date} đến ngày ${data.period.end_date}`
                        : ""}
                </p>
                <p
                    style={{
                        margin: 0,
                        fontSize: "11px",
                        fontStyle: "italic",
                    }}
                >
                    Đơn vị tính: Đồng
                </p>
            </div>

            {/* ── Bảng chuẩn S03a-DN ── */}
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "8px",
                    tableLayout: "fixed",
                }}
            >
                <colgroup>
                    {/* A - Ngày tháng ghi sổ */}
                    <col style={{ width: "9%" }} />
                    {/* B - Số hiệu CT */}
                    <col style={{ width: "8%" }} />
                    {/* C - Ngày tháng CT */}
                    <col style={{ width: "8%" }} />
                    {/* D - Diễn giải */}
                    <col style={{ width: "35%" }} />
                    {/* E - Đã ghi sổ cái */}
                    <col style={{ width: "5%" }} />
                    {/* G - STT dòng */}
                    <col style={{ width: "5%" }} />
                    {/* H - Số hiệu TK */}
                    <col style={{ width: "6%" }} />
                    {/* 1 - Số tiền Nợ */}
                    <col style={{ width: "12%" }} />
                    {/* 2 - Số tiền Có */}
                    <col style={{ width: "12%" }} />
                </colgroup>

                <thead>
                    {/* Hàng 1: nhóm cột */}
                    <tr>
                        <th
                            rowSpan={2}
                            style={{
                                ...thCell,
                                verticalAlign: "middle",
                                lineHeight: "1.4",
                            }}
                        >
                            Ngày,
                            <br />
                            tháng
                            <br />
                            ghi sổ
                        </th>
                        <th colSpan={2} style={thCell}>
                            Chứng từ
                        </th>
                        <th
                            rowSpan={2}
                            style={{
                                ...thCell,
                                verticalAlign: "middle",
                            }}
                        >
                            Diễn giải
                        </th>
                        <th
                            rowSpan={2}
                            style={{
                                ...thCell,
                                verticalAlign: "middle",
                                lineHeight: "1.4",
                            }}
                        >
                            Đã ghi
                            <br />
                            sổ cái
                        </th>
                        <th
                            rowSpan={2}
                            style={{
                                ...thCell,
                                verticalAlign: "middle",
                                lineHeight: "1.4",
                            }}
                        >
                            STT
                            <br />
                            dòng
                        </th>
                        <th
                            rowSpan={2}
                            style={{
                                ...thCell,
                                verticalAlign: "middle",
                                lineHeight: "1.4",
                            }}
                        >
                            Số hiệu
                            <br />
                            TK
                        </th>
                        <th colSpan={2} style={thCell}>
                            Số phát sinh
                        </th>
                    </tr>

                    {/* Hàng 2: sub-header */}
                    <tr>
                        <th style={thCell}>Số hiệu</th>
                        <th style={thCell}>Ngày, tháng</th>
                        <th style={thCell}>Nợ</th>
                        <th style={thCell}>Có</th>
                    </tr>

                    {/* Hàng 3: ký hiệu cột */}
                    <tr>
                        {["A", "B", "C", "D", "E", "G", "H", "1", "2"].map(
                            (lbl) => (
                                <td key={lbl} style={labelRow}>
                                    {lbl}
                                </td>
                            ),
                        )}
                    </tr>
                </thead>

                <tbody>
                    {/* Dòng chuyển trang trước */}
                    <tr>
                        <td
                            colSpan={4}
                            style={{ ...cell, fontStyle: "italic" }}
                        >
                            &nbsp;&nbsp;Số trang trước chuyển sang
                        </td>
                        <td style={cell} />
                        <td style={cell} />
                        <td style={cell} />
                        <td style={cell} />
                        <td style={cell} />
                    </tr>

                    {/* Dữ liệu */}
                    {data.data.map((row, index) => (
                        <tr key={index}>
                            {/* A - Ngày tháng ghi sổ */}
                            <td
                                style={{
                                    ...cell,
                                    textAlign: "center",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {row.ngay_ct && row.thang_ct && row.nam_ct
                                    ? `${String(row.ngay_ct).padStart(2, "0")}/${String(row.thang_ct).padStart(2, "0")}/${row.nam_ct}`
                                    : row.ngay_thang_ct || ""}
                            </td>

                            {/* B - Số hiệu CT */}
                            <td
                                style={{
                                    ...cell,
                                    textAlign: "center",
                                    fontWeight: "500",
                                }}
                            >
                                {row.so_hieu_ct || ""}
                            </td>

                            {/* C - Ngày tháng CT */}
                            <td
                                style={{
                                    ...cell,
                                    textAlign: "center",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {row.ngay_ct && row.thang_ct && row.nam_ct
                                    ? `${String(row.ngay_ct).padStart(2, "0")}/${String(row.thang_ct).padStart(2, "0")}/${row.nam_ct}`
                                    : row.ngay_thang_ct || ""}
                            </td>

                            {/* D - Diễn giải */}
                            <td style={cell}>
                                {row.dien_giai || ""}
                                {row.partner_info && (
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "10px",
                                            color: "#555",
                                            marginTop: "1px",
                                        }}
                                    >
                                        {row.partner_info}
                                    </span>
                                )}
                            </td>

                            {/* E - Đã ghi sổ cái */}
                            <td style={{ ...cell, textAlign: "center" }}>
                                {row.da_ghi_so_cai ? "x" : ""}
                            </td>

                            {/* G - STT dòng */}
                            <td style={{ ...cell, textAlign: "center" }}>
                                {row.stt || ""}
                            </td>

                            {/* H - Số hiệu TK */}
                            <td
                                style={{
                                    ...cell,
                                    textAlign: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                {row.tk_no || row.tk_co || ""}
                            </td>

                            {/* 1 - Số tiền Nợ */}
                            <td style={{ ...cell, textAlign: "right" }}>
                                {formatMoney(row.so_tien_no)}
                            </td>

                            {/* 2 - Số tiền Có */}
                            <td style={{ ...cell, textAlign: "right" }}>
                                {formatMoney(row.so_tien_co)}
                            </td>
                        </tr>
                    ))}

                    {/* Dòng cộng chuyển sang trang sau */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td
                            colSpan={4}
                            style={{ ...cell, fontStyle: "italic" }}
                        >
                            &nbsp;&nbsp;Cộng chuyển sang trang sau
                        </td>
                        <td style={cell} />
                        <td style={cell} />
                        <td style={cell} />
                        <td style={{ ...cell, textAlign: "right" }}>
                            {formatMoney(totalDebit)}
                        </td>
                        <td style={{ ...cell, textAlign: "right" }}>
                            {formatMoney(totalCredit)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ── Ghi chú cuối bảng ── */}
            <div
                style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    lineHeight: "1.8",
                }}
            >
                <p style={{ margin: 0 }}>
                    - Sổ này có .... trang, đánh số từ trang số 01 đến trang ...
                </p>
                <p style={{ margin: 0 }}>- Ngày mở sổ: ....</p>
            </div>

            {/* ── Ngày ký ── */}
            <div
                style={{
                    textAlign: "right",
                    marginTop: "16px",
                    fontSize: "12px",
                    fontStyle: "italic",
                }}
            >
                Ngày ... tháng ... năm ...
            </div>

            {/* ── Ký tên 3 cột — TT99 giữ nguyên cấu trúc ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "12px",
                    textAlign: "center",
                }}
            >
                <div style={{ width: "30%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 55px 0" }}>
                        Người lập biểu
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            margin: 0,
                            fontSize: "11px",
                        }}
                    >
                        (Ký, họ tên)
                    </p>
                </div>
                <div style={{ width: "30%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 55px 0" }}>
                        Kế toán trưởng
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            margin: 0,
                            fontSize: "11px",
                        }}
                    >
                        (Ký, họ tên)
                    </p>
                </div>
                <div style={{ width: "30%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 55px 0" }}>
                        Người đại diện theo pháp luật
                    </p>
                    <p
                        style={{
                            fontStyle: "italic",
                            margin: 0,
                            fontSize: "11px",
                        }}
                    >
                        (Ký, họ tên, đóng dấu)
                    </p>
                </div>
            </div>
        </div>
    );
});

GeneralJournalPrint.displayName = "GeneralJournalPrint";
export default GeneralJournalPrint;