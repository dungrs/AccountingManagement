import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PaymentVoucherPrint = forwardRef(
    ({ voucher, user, partner, system_languages }, ref) => {
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

        // Format date with full text (Ngày dd tháng MM năm yyyy)
        const formatDateFull = (dateString) => {
            if (!dateString) return "";
            try {
                const date = new Date(dateString);
                return `Ngày ${format(date, "dd", { locale: vi })} tháng ${format(date, "MM", { locale: vi })} năm ${format(date, "yyyy", { locale: vi })}`;
            } catch (error) {
                return dateString;
            }
        };

        // Format money
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

        // Convert number to Vietnamese text
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

                // Đọc hàng trăm
                if (hundred > 0) {
                    result += digits[hundred] + " trăm ";
                    if (ten === 0 && unit !== 0) result += "linh ";
                }

                // Đọc hàng chục và đơn vị
                if (ten > 1) {
                    result += digits[ten] + " mươi ";
                    if (unit === 1) {
                        result += "mốt ";
                    } else if (unit === 5) {
                        result += "lăm ";
                    } else if (unit > 0) {
                        result += digits[unit] + " ";
                    }
                } else if (ten === 1) {
                    result += "mười ";
                    if (unit === 1) {
                        result += "một ";
                    } else if (unit === 5) {
                        result += "lăm ";
                    } else if (unit > 0) {
                        result += digits[unit] + " ";
                    }
                } else if (unit > 0) {
                    if (hasFollowingGroup && unit === 1) {
                        result += "một ";
                    } else {
                        result += digits[unit] + " ";
                    }
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
                    const groupText = readGroup(group, n >= 1000);
                    result =
                        groupText +
                        (units[unitIndex] ? " " + units[unitIndex] + " " : "") +
                        result;
                    hasValue = true;
                } else if (hasValue && unitIndex === 1) {
                    // Thêm "không nghìn" nếu cần
                    result = "không nghìn " + result;
                }
                n = Math.floor(n / 1000);
                unitIndex++;
            }

            result = result.trim().replace(/\s+/g, " ");
            result = result.charAt(0).toUpperCase() + result.slice(1);

            // Thêm "đồng" vào cuối
            if (!result.endsWith("đồng")) {
                result += " đồng";
            }

            return result + ".";
        };

        const sys = system_languages || {};

        const companyName = sys.homepage_company || "CÔNG TY TNHH ABC";
        const officeAddress =
            sys.contact_office ||
            "Tầng 9, Tòa nhà Technosoft, Duy Tân, Cầu Giấy, Hà Nội";
        const hotline = sys.contact_hotline || "";
        const phone = sys.contact_phone || "";
        const email = sys.contact_email || "";
        const website = sys.contact_website || "";

        // Get person in charge
        const getCreatedByName = () => {
            if (voucher?.created_by_name) return voucher.created_by_name;
            if (user?.name) return user.name;
            return "";
        };

        // Get cashier name (Thủ quỹ)
        const getCashierName = () => {
            // Nếu có thông tin thủ quỹ riêng thì dùng, không thì dùng user hiện tại
            return voucher?.cashier_name || user?.name || "";
        };

        // Get receiver name
        const getReceiverName = () => {
            if (voucher?.receiver_name) return voucher.receiver_name;
            if (partner?.name) return partner.name;
            return "";
        };

        // Get receiver full info
        const getReceiverInfo = () => {
            let info = getReceiverName();
            if (partner?.tax_code) info += ` - ${partner.tax_code}`;
            return info;
        };

        // Get reason
        const getReason = () => {
            return (
                voucher?.reason || voucher?.note || voucher?.description || ""
            );
        };

        // Get amount
        const getAmount = () => {
            return parseFloat(voucher?.amount) || 0;
        };

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
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div style={{ width: "60%", fontSize: "13px" }}>
                        <p className="font-bold uppercase text-base mb-1">
                            {companyName}
                        </p>
                        <p style={{ fontSize: "12px" }}>{officeAddress}</p>
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

                    <div
                        style={{ width: "35%", fontSize: "12px" }}
                        className="text-right"
                    >
                        <p className="font-bold">Mẫu số: 02 - TT</p>
                        <p className="italic" style={{ fontSize: "11px" }}>
                            (Ban hành kèm theo Thông tư số 88/2021/TT-BTC
                        </p>
                        <p className="italic" style={{ fontSize: "11px" }}>
                            Ngày 11/10/2021 của Bộ Tài chính)
                        </p>
                    </div>
                </div>

                {/* Title */}
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

                {/* Content */}
                <div className="mb-8" style={{ fontSize: "14px" }}>
                    <p className="mb-3">
                        Họ tên người nhận tiền:{" "}
                        <span className="font-semibold">
                            {getReceiverInfo()}
                        </span>
                    </p>
                    <p className="mb-3">Địa chỉ: {partner?.address || ""}</p>
                    <p className="mb-3">Lý do nộp: {getReason()}</p>
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

                {/* Date on the right side */}
                <div className="text-right mb-16" style={{ fontSize: "14px" }}>
                    <p className="italic">
                        {formatDateFull(voucher?.voucher_date || new Date())}
                    </p>
                </div>

                {/* Signatures - 3 columns */}
                <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                        <p className="font-bold mb-2">Người lập biểu</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                        <p className="mt-8 font-semibold">
                            {getCreatedByName()}
                        </p>
                    </div>
                    <div>
                        <p className="font-bold mb-2">Thủ quỹ</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                        <p className="mt-8 font-semibold">{getCashierName()}</p>
                    </div>
                    <div>
                        <p className="font-bold mb-2">Người nhận tiền</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                        <p className="mt-8 font-semibold">
                            {getReceiverName()}
                        </p>
                    </div>
                </div>

                {/* Footer note */}
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