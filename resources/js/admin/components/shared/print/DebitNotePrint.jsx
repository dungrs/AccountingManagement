import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * DebitNotePrint — Giấy báo nợ (Phiếu ghi nợ)
 * Căn cứ pháp lý:
 *   • Thông tư 99/2025/TT-BTC ngày 27/10/2025 (hiệu lực 01/01/2026)
 *   • Mẫu số 05 - BN (Giấy báo nợ)
 */
const DebitNotePrint = forwardRef(
    ({ note, user, party, partyType, system_languages }, ref) => {
        /* ── Helpers ── */
        const formatDateFull = (dateString) => {
            if (!dateString) return "";
            try {
                const date = new Date(dateString);
                return `Ngày ${format(date, "dd", { locale: vi })} tháng ${format(date, "MM", { locale: vi })} năm ${format(date, "yyyy", { locale: vi })}`;
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
                maximumFractionDigits: 0,
            });
        };

        const numberToVietnameseText = (num) => {
            if (!num || num === 0) return "Không đồng";
            const units = [
                "",
                "nghìn",
                "triệu",
                "tỷ",
                "nghìn tỷ",
                "triệu tỷ",
                "tỷ tỷ",
            ];
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
            const readGroup = (group, hasFollowingGroup) => {
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
                    if (unit === 1) result += "một ";
                    else if (unit === 5) result += "lăm ";
                    else if (unit > 0) result += digits[unit] + " ";
                } else if (unit > 0) {
                    result +=
                        (hasFollowingGroup && unit === 1
                            ? "một"
                            : digits[unit]) + " ";
                }
                return result;
            };
            let n = Math.floor(num);
            if (n === 0) return "Không đồng";
            let result = "";
            let unitIndex = 0;
            let hasValue = false;
            while (n > 0) {
                const group = n % 1000;
                if (group > 0) {
                    result =
                        readGroup(group, n >= 1000) +
                        (units[unitIndex] ? " " + units[unitIndex] + " " : "") +
                        result;
                    hasValue = true;
                } else if (hasValue && unitIndex === 1) {
                    result = "không nghìn " + result;
                }
                n = Math.floor(n / 1000);
                unitIndex++;
            }
            result = result.trim().replace(/\s+/g, " ");
            result = result.charAt(0).toUpperCase() + result.slice(1);
            if (!result.endsWith("đồng")) result += " đồng";
            return result + ".";
        };

        // Lấy tài khoản từ journal entries
        const getDebitAccount = () => {
            if (note?.journal_entries?.length) {
                const debitEntry = note.journal_entries.find(
                    (d) => parseFloat(d.debit) > 0,
                );
                if (debitEntry) return debitEntry.account_code;
            }
            return "331";
        };

        const getCreditAccount = () => {
            if (note?.journal_entries?.length) {
                const creditEntry = note.journal_entries.find(
                    (d) => parseFloat(d.credit) > 0,
                );
                if (creditEntry) return creditEntry.account_code;
            }
            return "1121";
        };

        /* ── Dữ liệu công ty ── */
        const sys = system_languages || {};
        const companyName = sys.homepage_company || "CÔNG TY TNHH ABC";
        const officeAddress = sys.contact_office || "";

        /* ── Getters ── */
        const getCreatedByName = () =>
            note?.created_by_name || user?.name || "";
        const getPartyName = () => party?.name || "";
        const getPartyAddress = () => party?.address || "";
        const getReason = () => note?.reason || note?.note || "";
        const getTotalAmount = () => parseFloat(note?.total_amount) || 0;
        const getNoteCode = () => note?.code || "";
        const getIssueDate = () => note?.issue_date || new Date();

        const getFormattedAmount = () => formatMoney(getTotalAmount());

        return (
            <div
                ref={ref}
                className="bg-white text-black"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "15mm 20mm",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: "#000000",
                }}
            >
                {/* ── Header ── */}
                <div className="flex justify-between items-start mb-6">
                    <div style={{ width: "60%" }}>
                        <p className="font-bold uppercase text-base mb-1">
                            {companyName}
                        </p>
                        {officeAddress && (
                            <p className="text-xs">{officeAddress}</p>
                        )}
                    </div>
                    <div className="text-right" style={{ width: "35%" }}>
                        <p className="font-bold">Mẫu số: 05 - BN</p>
                        <p className="italic text-xs">
                            (Ban hành kèm theo Thông tư số 99/2025/TT-BTC
                        </p>
                        <p className="italic text-xs">
                            Ngày 27/10/2025 của Bộ Tài chính)
                        </p>
                    </div>
                </div>

                {/* ── Tiêu đề ── */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase mb-2">
                        GIẤY BÁO NỢ
                    </h1>
                    <div className="flex justify-between items-center mt-2 px-4">
                        <p className="text-sm">
                            Quyển số: .........................
                        </p>
                        <p className="text-sm font-semibold">
                            Số: {getNoteCode() || "....................."}
                        </p>
                    </div>
                </div>

                {/* ── Bảng định khoản ── */}
                <div className="mb-6">
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1px solid #000",
                        }}
                    >
                        <thead>
                            <tr className="bg-gray-100">
                                <th
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                        width: "15%",
                                    }}
                                >
                                    TK
                                </th>
                                <th
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                        width: "15%",
                                    }}
                                >
                                    Mã số
                                </th>
                                <th
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                        width: "50%",
                                    }}
                                >
                                    Diễn giải
                                </th>
                                <th
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                        width: "20%",
                                    }}
                                >
                                    Số tiền
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Nợ
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                    }}
                                >
                                    {getDebitAccount()}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                    }}
                                >
                                    {getReason() || "Thanh toán công nợ"}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "right",
                                    }}
                                >
                                    {getFormattedAmount()}
                                </td>
                            </tr>
                            <tr>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Có
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "center",
                                    }}
                                >
                                    {getCreditAccount()}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                    }}
                                >
                                    {getReason() || "Thanh toán công nợ"}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "right",
                                    }}
                                >
                                    {getFormattedAmount()}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50">
                                <td
                                    colSpan="3"
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "right",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Tổng cộng
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #000",
                                        padding: "5px",
                                        textAlign: "right",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {getFormattedAmount()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* ── Thông tin chi tiết ── */}
                <div className="mb-6" style={{ fontSize: "14px" }}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex">
                            <div style={{ width: "140px" }}>
                                Họ tên người nhận:
                            </div>
                            <div className="font-semibold border-b border-dotted border-slate-400 flex-1 ml-2">
                                {getPartyName() || "........................."}
                            </div>
                        </div>
                        <div className="flex">
                            <div style={{ width: "100px" }}>Số tiền:</div>
                            <div className="font-semibold border-b border-dotted border-slate-400 flex-1 ml-2">
                                {getFormattedAmount()} VND
                            </div>
                        </div>
                    </div>
                    <div className="flex mb-2">
                        <div style={{ width: "140px" }}>Địa chỉ:</div>
                        <div className="border-b border-dotted border-slate-400 flex-1 ml-2">
                            {getPartyAddress() || "........................."}
                        </div>
                    </div>
                    <div className="flex mb-2">
                        <div style={{ width: "140px" }}>Lý do:</div>
                        <div className="border-b border-dotted border-slate-400 flex-1 ml-2">
                            {getReason() || "........................."}
                        </div>
                    </div>
                    <div className="flex mb-2">
                        <div style={{ width: "140px" }}>Viết bằng chữ:</div>
                        <div className="italic font-semibold flex-1 ml-2">
                            {getTotalAmount() > 0
                                ? numberToVietnameseText(getTotalAmount())
                                : "....................................................."}
                        </div>
                    </div>
                    <div className="flex mb-2">
                        <div style={{ width: "140px" }}>Kèm theo:</div>
                        <div className="border-b border-dotted border-slate-400 flex-1 ml-2">
                            ......................... chứng từ gốc
                        </div>
                    </div>
                </div>

                {/* ── Ngày tháng ── */}
                <div className="text-right mb-8">
                    <p className="italic">{formatDateFull(getIssueDate())}</p>
                </div>

                {/* ── Chữ ký ── */}
                <div
                    className="grid gap-6 text-center"
                    style={{
                        fontSize: "12px",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        marginTop: "20px",
                    }}
                >
                    <div>
                        <p className="font-bold mb-1">Giám đốc</p>
                        <p className="italic text-xs">(Ký, họ tên, đóng dấu)</p>
                        <div className="h-12"></div>
                        <p className="italic text-xs mt-6">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Kế toán trưởng</p>
                        <p className="italic text-xs">(Ký, họ tên)</p>
                        <div className="h-12"></div>
                        <p className="italic text-xs mt-6">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Người lập phiếu</p>
                        <p className="italic text-xs">(Ký, họ tên)</p>
                        <div className="h-12"></div>
                        <p className="italic text-xs mt-6">
                            {getCreatedByName() || "(Ký, họ tên)"}
                        </p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">
                            {partyType === "customer"
                                ? "Khách hàng"
                                : "Nhà cung cấp"}
                        </p>
                        <p className="italic text-xs">(Ký, họ tên)</p>
                        <div className="h-12"></div>
                        <p className="italic text-xs mt-6">
                            {getPartyName() || "(Ký, họ tên)"}
                        </p>
                    </div>
                </div>
            </div>
        );
    },
);

DebitNotePrint.displayName = "DebitNotePrint";

export default DebitNotePrint;