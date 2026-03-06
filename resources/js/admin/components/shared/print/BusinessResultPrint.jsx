import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatNumber } from "@/admin/utils/helpers";

/**
 * BusinessResultPrint — Báo cáo kết quả hoạt động kinh doanh (Mẫu số B02-DN)
 * Căn cứ pháp lý:
 *   • Thông tư 99/2025/TT-BTC ngày 27/10/2025 (hiệu lực 01/01/2026)
 *     thay thế Thông tư 200/2014/TT-BTC ngày 22/12/2014
 */
const BusinessResultPrint = forwardRef(({ data, systems }, ref) => {
    if (!data || !data.current) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    const companyName    = systems?.homepage_company  || "CÔNG TY TNHH ABC";
    const companyAddress = systems?.contact_address   || "123 Đường ABC, Quận 1, TP.HCM";

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

    const tdStyle     = { border: "1px solid black", padding: "4px", color: "#000000", fontSize: "11px" };
    const tdRightStyle = { ...tdStyle, textAlign: "right" };
    const tdLeftStyle  = { ...tdStyle, textAlign: "left" };
    const tdCenterStyle = { ...tdStyle, textAlign: "center" };

    const cur  = data.current;
    const prev = data.previous;

    /* ── Rows helper để giảm lặp ── */
    const Row = ({ label, code, curVal, prevVal, bold = false, indent = false, bg }) => (
        <tr style={{ fontWeight: bold ? "bold" : "normal", backgroundColor: bg || "transparent" }}>
            <td style={{ ...tdLeftStyle, paddingLeft: indent ? "20px" : "4px" }}>{label}</td>
            <td style={tdCenterStyle}>{code}</td>
            <td style={tdCenterStyle}></td>
            <td style={tdRightStyle}>{curVal}</td>
            <td style={tdRightStyle}>{prevVal}</td>
        </tr>
    );

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
            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ width: "50%", fontSize: "13px" }}>
                    <p style={{ fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0" }}>
                        {companyName}
                    </p>
                    <p style={{ margin: "2px 0" }}>Địa chỉ: {companyAddress}</p>
                </div>

                {/* Cột phải: cập nhật sang TT99/2025 */}
                <div style={{ width: "45%", fontSize: "12px", textAlign: "right" }}>
                    <p style={{ fontWeight: "bold", margin: "0" }}>Mẫu số B 02 – DN</p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        (Ban hành theo Thông tư số 99/2025/TT-BTC
                    </p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        Ngày 27/10/2025 của Bộ Tài chính)
                    </p>
                </div>
            </div>

            {/* ── Tiêu đề ── */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 8px 0" }}>
                    BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH
                </h1>
                <p style={{ fontSize: "14px", fontWeight: "bold", margin: "4px 0" }}>
                    Năm {data.period?.year || new Date().getFullYear()}
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Từ ngày {data.period?.start_date} đến ngày {data.period?.end_date}
                </p>
            </div>

            {/* ── Bảng chính ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#000000" }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, width: "45%" }}>CHỈ TIÊU</th>
                        <th style={{ ...thStyle, width: "8%" }}>Mã số</th>
                        <th style={{ ...thStyle, width: "12%" }}>Thuyết minh</th>
                        <th style={{ ...thStyle, width: "17%" }}>Năm nay</th>
                        <th style={{ ...thStyle, width: "18%" }}>Năm trước</th>
                    </tr>
                </thead>
                <tbody>
                    <Row label="1. Doanh thu bán hàng và cung cấp dịch vụ"
                         code="01"
                         curVal={formatNumber(cur.revenue?.total || 0)}
                         prevVal={formatNumber(prev.revenue?.total || 0)} />

                    <Row label="2. Các khoản giảm trừ doanh thu"
                         code="02"
                         curVal={formatNumber(cur.revenue?.reductions || 0)}
                         prevVal={formatNumber(prev.revenue?.reductions || 0)} />

                    <Row label="3. Doanh thu thuần về bán hàng và cung cấp dịch vụ (10 = 01 - 02)"
                         code="10" bold
                         curVal={formatNumber(cur.revenue?.net || 0)}
                         prevVal={formatNumber(prev.revenue?.net || 0)} />

                    <Row label="4. Giá vốn hàng bán"
                         code="11"
                         curVal={formatNumber(cur.cogs?.total || 0)}
                         prevVal={formatNumber(prev.cogs?.total || 0)} />

                    <Row label="5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ (20 = 10 - 11)"
                         code="20" bold
                         curVal={formatNumber(cur.gross_profit || 0)}
                         prevVal={formatNumber(prev.gross_profit || 0)} />

                    <Row label="6. Doanh thu hoạt động tài chính"
                         code="21" curVal="0" prevVal="0" />

                    <Row label="7. Chi phí tài chính"
                         code="22" curVal="0" prevVal="0" />

                    <Row label="- Trong đó: Chi phí lãi vay"
                         code="23" indent curVal="0" prevVal="0" />

                    <Row label="8. Chi phí bán hàng"
                         code="25"
                         curVal={formatNumber(cur.expenses?.selling || 0)}
                         prevVal={formatNumber(prev.expenses?.selling || 0)} />

                    <Row label="9. Chi phí quản lý doanh nghiệp"
                         code="26"
                         curVal={formatNumber(cur.expenses?.admin || 0)}
                         prevVal={formatNumber(prev.expenses?.admin || 0)} />

                    <Row label="10. Lợi nhuận thuần từ hoạt động kinh doanh (30 = 20 + (21 - 22) - (25 + 26))"
                         code="30" bold
                         curVal={formatNumber(cur.operating_profit || 0)}
                         prevVal={formatNumber(prev.operating_profit || 0)} />

                    <Row label="11. Thu nhập khác"
                         code="31"
                         curVal={formatNumber(cur.other_income || 0)}
                         prevVal={formatNumber(prev.other_income || 0)} />

                    <Row label="12. Chi phí khác"
                         code="32"
                         curVal={formatNumber(cur.other_expense || 0)}
                         prevVal={formatNumber(prev.other_expense || 0)} />

                    <Row label="13. Lợi nhuận khác (40 = 31 - 32)"
                         code="40"
                         curVal={formatNumber((cur.other_income || 0) - (cur.other_expense || 0))}
                         prevVal={formatNumber((prev.other_income || 0) - (prev.other_expense || 0))} />

                    <Row label="14. Tổng lợi nhuận kế toán trước thuế (50 = 30 + 40)"
                         code="50" bold
                         curVal={formatNumber(cur.profit_before_tax || 0)}
                         prevVal={formatNumber(prev.profit_before_tax || 0)} />

                    <Row label="15. Chi phí thuế TNDN hiện hành"
                         code="51"
                         curVal={formatNumber(cur.income_tax || 0)}
                         prevVal={formatNumber(prev.income_tax || 0)} />

                    <Row label="16. Chi phí thuế TNDN hoãn lại"
                         code="52" curVal="0" prevVal="0" />

                    <Row label="17. Lợi nhuận sau thuế thu nhập doanh nghiệp (60 = 50 - 51 - 52)"
                         code="60" bold bg="#f5f5f5"
                         curVal={formatNumber(cur.profit_after_tax || 0)}
                         prevVal={formatNumber(prev.profit_after_tax || 0)} />

                    <Row label="18. Lãi cơ bản trên cổ phiếu (*)"
                         code="70" curVal="-" prevVal="-" />

                    <Row label="19. Lãi suy giảm trên cổ phiếu (*)"
                         code="71" curVal="-" prevVal="-" />
                </tbody>
            </table>

            {/* ── Ghi chú ── */}
            <div style={{ marginTop: "16px", fontSize: "11px", fontStyle: "italic" }}>
                <p>(*) Chỉ áp dụng tại công ty cổ phần</p>
            </div>

            {/* ── Ngày ký ── */}
            <div style={{ textAlign: "right", marginTop: "24px", marginBottom: "8px", fontSize: "13px" }}>
                <p style={{ margin: 0 }}>
                    Ngày {format(new Date(), "dd")} tháng {format(new Date(), "MM")} năm {format(new Date(), "yyyy")}
                </p>
            </div>

            {/* ── Chữ ký ── */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "20px" }}>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 40px 0" }}>NGƯỜI LẬP BIỂU</p>
                    <p style={{ fontStyle: "italic", fontSize: "12px", margin: 0 }}>(Ký, họ tên)</p>
                </div>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 40px 0" }}>KẾ TOÁN TRƯỞNG</p>
                    <p style={{ fontStyle: "italic", fontSize: "12px", margin: 0 }}>(Ký, họ tên)</p>
                </div>
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 40px 0" }}>GIÁM ĐỐC</p>
                    <p style={{ fontStyle: "italic", fontSize: "12px", margin: 0 }}>(Ký, họ tên, đóng dấu)</p>
                </div>
            </div>

            {/* ── Thông tin dịch vụ kế toán ── */}
            <div style={{ marginTop: "16px", fontSize: "10px", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
                <p>- Số chứng chỉ hành nghề: ................</p>
                <p>- Đơn vị cung cấp dịch vụ kế toán: ................</p>
                <p style={{ fontStyle: "italic" }}>
                    Đối với người lập biểu là các đơn vị dịch vụ kế toán phân giải rõ số chứng chỉ hành nghề,
                    tên và địa chỉ đơn vị cung cấp dịch vụ kế toán. Người lập biểu là cá nhân ghi rõ số chứng chỉ hành nghề.
                </p>
            </div>
        </div>
    );
});

BusinessResultPrint.displayName = "BusinessResultPrint";

export default BusinessResultPrint;