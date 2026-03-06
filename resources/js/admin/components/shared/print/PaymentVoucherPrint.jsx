import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * PaymentVoucherPrint — Phiếu chi (Mẫu số 02 – TT)
 * Căn cứ pháp lý:
 *   • Thông tư 99/2025/TT-BTC ngày 27/10/2025 (hiệu lực 01/01/2026)
 *     thay thế Thông tư 200/2014/TT-BTC và Thông tư 133/2016/TT-BTC
 */
const PaymentVoucherPrint = forwardRef(
    ({ voucher, user, partner, system_languages }, ref) => {
        /* ── Helpers ── */
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

        /* ── Dữ liệu công ty ── */
        const sys = system_languages || {};
        const companyName = sys.homepage_company || "CÔNG TY TNHH ABC";
        const officeAddress = sys.contact_office || "";
        const hotline = sys.contact_hotline || "";
        const phone = sys.contact_phone || "";
        const email = sys.contact_email || "";
        const website = sys.contact_website || "";

        /* ── Getters ── */
        const getCreatedByName = () =>
            voucher?.created_by_name || user?.name || "";
        const getCashierName = () => voucher?.cashier_name || user?.name || "";
        const getReceiverName = () =>
            voucher?.receiver_name || partner?.name || "";
        const getReceiverInfo = () => {
            let info = getReceiverName();
            if (partner?.tax_code) info += ` - ${partner.tax_code}`;
            return info;
        };
        const getReason = () =>
            voucher?.reason || voucher?.note || voucher?.description || "";
        const getAmount = () => parseFloat(voucher?.amount) || 0;

        /* ── Render ── */
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
                <div className="flex justify-between items-start mb-4">
                    <div style={{ width: "60%", fontSize: "13px" }}>
                        <p className="font-bold uppercase text-base mb-1">
                            {companyName}
                        </p>
                        {officeAddress && (
                            <p style={{ fontSize: "12px" }}>{officeAddress}</p>
                        )}
                        {(phone || hotline) && (
                            <p style={{ fontSize: "12px" }}>
                                {phone && `ĐT: ${phone}`}
                                {phone && hotline ? " - " : ""}
                                {hotline && `Hotline: ${hotline}`}
                            </p>
                        )}
                        {email && (
                            <p style={{ fontSize: "12px" }}>Email: {email}</p>
                        )}
                        {website && (
                            <p style={{ fontSize: "12px" }}>
                                Website: {website}
                            </p>
                        )}
                    </div>

                    {/* Cột phải: cập nhật sang TT99/2025 */}
                    <div
                        style={{ width: "35%", fontSize: "12px" }}
                        className="text-right"
                    >
                        <p className="font-bold">Mẫu số: 02 - TT</p>
                        <p className="italic" style={{ fontSize: "11px" }}>
                            (Ban hành kèm theo Thông tư số 99/2025/TT-BTC
                        </p>
                        <p className="italic" style={{ fontSize: "11px" }}>
                            Ngày 27/10/2025 của Bộ Tài chính)
                        </p>
                    </div>
                </div>

                {/* ── Tiêu đề ── */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase mb-2">
                        PHIẾU CHI
                    </h1>
                    <p className="text-base mb-1">
                        {formatDateFull(voucher?.voucher_date || new Date())}
                    </p>
                    <div className="flex justify-center items-center gap-8 mt-1">
                        <p className="text-base">
                            Quyển số: .........................
                        </p>
                        <p className="text-base font-semibold">
                            Số: {voucher?.code || "PC00001"}
                        </p>
                    </div>
                </div>

                {/* ── Nội dung ── */}
                <div className="mb-8" style={{ fontSize: "14px" }}>
                    <p className="mb-3">
                        Họ tên người nhận tiền:{" "}
                        <span className="font-semibold">
                            {getReceiverInfo()}
                        </span>
                    </p>
                    <p className="mb-3">Địa chỉ: {partner?.address || ""}</p>
                    <p className="mb-3">Lý do chi: {getReason()}</p>
                    <p className="mb-3">
                        Số tiền:{" "}
                        <span className="font-semibold">
                            {formatMoney(getAmount())} VND
                        </span>{" "}
                        Viết bằng chữ:{" "}
                        <span className="italic font-semibold">
                            {numberToVietnameseText(getAmount())}
                        </span>
                    </p>
                    <p className="mb-3">
                        Kèm theo: ................................. chứng từ gốc
                    </p>
                </div>

                {/* ── Ngày tháng ── */}
                <div className="text-right mb-8" style={{ fontSize: "14px" }}>
                    <p className="italic">
                        {formatDateFull(voucher?.voucher_date || new Date())}
                    </p>
                </div>

                {/*
                 * TT99/2025: phiếu chi cần đủ 5 chữ ký:
                 * Giám đốc, Kế toán trưởng, Người lập phiếu, Thủ quỹ, Người nhận tiền
                 */}
                <div
                    className="grid gap-4 text-center"
                    style={{
                        fontSize: "12px",
                        gridTemplateColumns: "repeat(5, 1fr)",
                    }}
                >
                    <div>
                        <p className="font-bold mb-1">Giám đốc</p>
                        <p className="italic text-xs">
                            (Hoặc người được ủy quyền)
                        </p>
                        <p className="italic text-xs mb-12">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Kế toán trưởng</p>
                        <p className="italic text-xs mb-2">&nbsp;</p>
                        <p className="italic text-xs mb-12">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Người lập phiếu</p>
                        <p className="italic text-xs mb-2">&nbsp;</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                        <p className="text-sm mt-2">{getCreatedByName()}</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Thủ quỹ</p>
                        <p className="italic text-xs mb-2">&nbsp;</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                        <p className="text-sm mt-2">{getCashierName()}</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Người nhận tiền</p>
                        <p className="italic text-xs mb-2">&nbsp;</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                        <p className="text-sm mt-2">{getReceiverName()}</p>
                    </div>
                </div>

                {/* ── Ghi chú cuối ── */}
                <div
                    className="mt-16 text-center italic"
                    style={{ fontSize: "13px" }}
                >
                    <p>
                        Đã nhận đủ số tiền (Viết bằng chữ):{" "}
                        {numberToVietnameseText(getAmount())}
                    </p>
                </div>
            </div>
        );
    },
);

PaymentVoucherPrint.displayName = "PaymentVoucherPrint";

export default PaymentVoucherPrint;