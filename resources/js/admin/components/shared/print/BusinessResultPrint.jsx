import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatNumber } from "@/admin/utils/helpers";

const BusinessResultPrint = forwardRef(({ data, systems }, ref) => {
    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
        } catch (error) {
            return dateString;
        }
    };

    if (!data || !data.current) {
        return <div ref={ref}>Không có dữ liệu</div>;
    }

    const companyName = systems?.homepage_company || "CÔNG TY TNHH ABC";
    const companyAddress =
        systems?.contact_address || "123 Đường ABC, Quận 1, TP.HCM";
    const companyTaxCode = systems?.contact_tax_code || "0123456789";
    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: vi });

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

    const tdRightStyle = {
        ...tdStyle,
        textAlign: "right",
    };

    const tdLeftStyle = {
        ...tdStyle,
        textAlign: "left",
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
                    <p style={{ margin: "2px 0" }}>Địa chỉ: {companyAddress}</p>
                </div>
                <div
                    style={{
                        width: "45%",
                        fontSize: "12px",
                        textAlign: "right",
                    }}
                >
                    <p style={{ fontWeight: "bold", margin: "0" }}>
                        Mẫu số B 02 – DN
                    </p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        (Ban hành theo Thông tư số 200/2014/TT-BTC
                    </p>
                    <p style={{ fontStyle: "italic", margin: "2px 0" }}>
                        Ngày 22/12/2014 của Bộ Tài chính)
                    </p>
                </div>
            </div>

            {/* Tiêu đề */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1
                    style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        margin: "0 0 8px 0",
                    }}
                >
                    BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH
                </h1>
                <p
                    style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        margin: "4px 0",
                    }}
                >
                    Năm {data.period?.year || new Date().getFullYear()}
                </p>
                <p style={{ fontSize: "13px", margin: "4px 0" }}>
                    Từ ngày {data.period?.start_date} đến ngày{" "}
                    {data.period?.end_date}
                </p>
            </div>

            {/* Bảng chính */}
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
                        <th style={{ ...thStyle, width: "45%" }}>CHỈ TIÊU</th>
                        <th style={{ ...thStyle, width: "8%" }}>Mã số</th>
                        <th style={{ ...thStyle, width: "12%" }}>
                            Thuyết minh
                        </th>
                        <th style={{ ...thStyle, width: "17%" }}>Năm nay</th>
                        <th style={{ ...thStyle, width: "18%" }}>Năm trước</th>
                    </tr>
                </thead>
                <tbody>
                    {/* 1. Doanh thu bán hàng và cung cấp dịch vụ */}
                    <tr>
                        <td style={tdLeftStyle}>
                            1. Doanh thu bán hàng và cung cấp dịch vụ
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>01</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.revenue?.total || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.revenue?.total || 0)}
                        </td>
                    </tr>

                    {/* 2. Các khoản giảm trừ doanh thu */}
                    <tr>
                        <td style={tdLeftStyle}>
                            2. Các khoản giảm trừ doanh thu
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>02</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.revenue?.reductions || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(
                                data.previous.revenue?.reductions || 0,
                            )}
                        </td>
                    </tr>

                    {/* 3. Doanh thu thuần về bán hàng và cung cấp dịch vụ */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td style={tdLeftStyle}>
                            3. Doanh thu thuần về bán hàng và cung cấp dịch vụ
                            (10 = 01 - 02)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>10</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.revenue?.net || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.revenue?.net || 0)}
                        </td>
                    </tr>

                    {/* 4. Giá vốn hàng bán */}
                    <tr>
                        <td style={tdLeftStyle}>4. Giá vốn hàng bán</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>11</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.cogs?.total || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.cogs?.total || 0)}
                        </td>
                    </tr>

                    {/* 5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td style={tdLeftStyle}>
                            5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ (20
                            = 10 - 11)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>20</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.gross_profit || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.gross_profit || 0)}
                        </td>
                    </tr>

                    {/* 6. Doanh thu hoạt động tài chính */}
                    <tr>
                        <td style={tdLeftStyle}>
                            6. Doanh thu hoạt động tài chính
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>21</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>0</td>
                        <td style={tdRightStyle}>0</td>
                    </tr>

                    {/* 7. Chi phí tài chính */}
                    <tr>
                        <td style={tdLeftStyle}>7. Chi phí tài chính</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>22</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>0</td>
                        <td style={tdRightStyle}>0</td>
                    </tr>

                    {/* - Trong đó: Chi phí lãi vay */}
                    <tr>
                        <td style={{ ...tdLeftStyle, paddingLeft: "20px" }}>
                            - Trong đó: Chi phí lãi vay
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>23</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>0</td>
                        <td style={tdRightStyle}>0</td>
                    </tr>

                    {/* 8. Chi phí bán hàng */}
                    <tr>
                        <td style={tdLeftStyle}>8. Chi phí bán hàng</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>25</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.expenses?.selling || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.expenses?.selling || 0)}
                        </td>
                    </tr>

                    {/* 9. Chi phí quản lý doanh nghiệp */}
                    <tr>
                        <td style={tdLeftStyle}>
                            9. Chi phí quản lý doanh nghiệp
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>26</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.expenses?.admin || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.expenses?.admin || 0)}
                        </td>
                    </tr>

                    {/* 10. Lợi nhuận thuần từ hoạt động kinh doanh */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td style={tdLeftStyle}>
                            10. Lợi nhuận thuần từ hoạt động kinh doanh (30 = 20
                            + (21 - 22) - (25 + 26))
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>30</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.operating_profit || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.operating_profit || 0)}
                        </td>
                    </tr>

                    {/* 11. Thu nhập khác */}
                    <tr>
                        <td style={tdLeftStyle}>11. Thu nhập khác</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>31</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.other_income || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.other_income || 0)}
                        </td>
                    </tr>

                    {/* 12. Chi phí khác */}
                    <tr>
                        <td style={tdLeftStyle}>12. Chi phí khác</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>32</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.other_expense || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.other_expense || 0)}
                        </td>
                    </tr>

                    {/* 13. Lợi nhuận khác */}
                    <tr>
                        <td style={tdLeftStyle}>
                            13. Lợi nhuận khác (40 = 31 - 32)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>40</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(
                                (data.current.other_income || 0) -
                                    (data.current.other_expense || 0),
                            )}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(
                                (data.previous.other_income || 0) -
                                    (data.previous.other_expense || 0),
                            )}
                        </td>
                    </tr>

                    {/* 14. Tổng lợi nhuận kế toán trước thuế */}
                    <tr style={{ fontWeight: "bold" }}>
                        <td style={tdLeftStyle}>
                            14. Tổng lợi nhuận kế toán trước thuế (50 = 30 + 40)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>50</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.profit_before_tax || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.profit_before_tax || 0)}
                        </td>
                    </tr>

                    {/* 15. Chi phí thuế TNDN hiện hành */}
                    <tr>
                        <td style={tdLeftStyle}>
                            15. Chi phí thuế TNDN hiện hành
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>51</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.income_tax || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.income_tax || 0)}
                        </td>
                    </tr>

                    {/* 16. Chi phí thuế TNDN hoãn lại */}
                    <tr>
                        <td style={tdLeftStyle}>
                            16. Chi phí thuế TNDN hoãn lại
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>52</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>0</td>
                        <td style={tdRightStyle}>0</td>
                    </tr>

                    {/* 17. Lợi nhuận sau thuế thu nhập doanh nghiệp */}
                    <tr
                        style={{
                            fontWeight: "bold",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        <td style={tdLeftStyle}>
                            17. Lợi nhuận sau thuế thu nhập doanh nghiệp (60 =
                            50 - 51 - 52)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>60</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.current.profit_after_tax || 0)}
                        </td>
                        <td style={tdRightStyle}>
                            {formatNumber(data.previous.profit_after_tax || 0)}
                        </td>
                    </tr>

                    {/* 18. Lãi cơ bản trên cổ phiếu */}
                    <tr>
                        <td style={tdLeftStyle}>
                            18. Lãi cơ bản trên cổ phiếu (*)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>70</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>-</td>
                        <td style={tdRightStyle}>-</td>
                    </tr>

                    {/* 19. Lãi suy giảm trên cổ phiếu */}
                    <tr>
                        <td style={tdLeftStyle}>
                            19. Lãi suy giảm trên cổ phiếu (*)
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>71</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}></td>
                        <td style={tdRightStyle}>-</td>
                        <td style={tdRightStyle}>-</td>
                    </tr>
                </tbody>
            </table>

            {/* Ghi chú */}
            <div
                style={{
                    marginTop: "16px",
                    fontSize: "11px",
                    fontStyle: "italic",
                }}
            >
                <p>(*) Chỉ áp dụng tại công ty cổ phần</p>
            </div>

            {/* Ngày ký */}
            <div
                style={{
                    textAlign: "right",
                    marginTop: "24px",
                    marginBottom: "8px",
                    fontSize: "13px",
                }}
            >
                <p style={{ margin: 0 }}>
                    Ngày {format(new Date(), "dd")} tháng{" "}
                    {format(new Date(), "MM")} năm {format(new Date(), "yyyy")}
                </p>
            </div>

            {/* Chữ ký */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginTop: "20px",
                }}
            >
                <div style={{ textAlign: "center", width: "33%" }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 40px 0" }}>
                        NGƯỜI LẬP BIỂU
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
                    <p style={{ fontWeight: "bold", margin: "0 0 40px 0" }}>
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
                    <p style={{ fontWeight: "bold", margin: "0 0 40px 0" }}>
                        GIÁM ĐỐC
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

            {/* Thông tin thêm cho người lập biểu là đơn vị dịch vụ kế toán */}
            <div
                style={{
                    marginTop: "16px",
                    fontSize: "10px",
                    borderTop: "1px dashed #ccc",
                    paddingTop: "8px",
                }}
            >
                <p>- Số chứng chỉ hành nghề: ................</p>
                <p>- Đơn vị cung cấp dịch vụ kế toán: ................</p>
                <p style={{ fontStyle: "italic" }}>
                    Đối với người lập biểu là các đơn vị dịch vụ kế toán phân
                    giải rõ số chứng chỉ hành nghề, tên và địa chỉ đơn vị cung
                    cấp dịch vụ kế toán. Người lập biểu là cá nhân ghi rõ số
                    chứng chỉ hành nghề.
                </p>
            </div>
        </div>
    );
});

BusinessResultPrint.displayName = "BusinessResultPrint";

export default BusinessResultPrint;