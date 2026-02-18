import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PurchaseReceiptPrint = forwardRef(
    ({ receipt, totals, user, system_languages }, ref) => {
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

        console.log(receipt);

        // Format money with better handling
        const formatMoney = (value) => {
            if (value === null || value === undefined || value === "")
                return "0";

            const num = Number(value);
            if (isNaN(num)) return "0";

            return num.toLocaleString("vi-VN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
        };

        const sys = system_languages || {};

        const companyName = sys.homepage_company || "";
        const officeAddress = sys.contact_office || "";
        const branchAddress = sys.contact_address || "";
        const hotline = sys.contact_hotline || "";
        const phone = sys.contact_phone || "";
        const email = sys.contact_email || "";
        const website = sys.contact_website || "";

        // Format date with full text
        const formatDateFull = (dateString) => {
            if (!dateString) return "";
            try {
                const date = new Date(dateString);
                return `Ngày ${format(date, "dd", { locale: vi })} tháng ${format(date, "MM", { locale: vi })} năm ${format(date, "yyyy", { locale: vi })}`;
            } catch (error) {
                return dateString;
            }
        };

        // Convert number to Vietnamese text - Improved version
        const numberToVietnameseText = (num) => {
            if (!num || num === 0) return "Không đồng";

            const units = ["", "nghìn", "triệu", "tỷ"];
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

            const readGroup = (group) => {
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
                    if (unit === 5) result += "lăm ";
                    else if (unit > 0) result += digits[unit] + " ";
                } else if (unit > 0) {
                    result += digits[unit] + " ";
                }

                return result.trim();
            };

            let n = Math.floor(num);
            if (n === 0) return "Không đồng";

            let result = "";
            let unitIndex = 0;

            while (n > 0) {
                const group = n % 1000;
                if (group > 0) {
                    const groupText = readGroup(group);
                    result = groupText + " " + units[unitIndex] + " " + result;
                }
                n = Math.floor(n / 1000);
                unitIndex++;
            }

            result = result.trim();
            return (
                result.charAt(0).toUpperCase() +
                result.slice(1) +
                " đồng chẵn."
            );
        };

        // Get unit name with fallback
        const getUnitName = (item) => {
            // Ưu tiên lấy từ unit object
            if (item.unit?.name) return item.unit.name;
            
            // Fallback về unit_name nếu có
            if (item.unit_name) return item.unit_name;
            
            // Default
            return "Cái";
        };

        // Get product code with priority
        const getProductCode = (item) => {
            return item.sku || item.barcode || item.code || "";
        };

        // Calculate total quantity for all products
        const getTotalQuantity = () => {
            if (!receipt.product_variants || receipt.product_variants.length === 0) return 0;
            return receipt.product_variants.reduce((sum, item) => {
                const qty = parseFloat(item.quantity) || 0;
                return sum + qty;
            }, 0);
        };

        // Calculate amount before VAT for each item (Số lượng x Đơn giá)
        const getAmountBeforeVAT = (item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            return quantity * price;
        };

        // Calculate total amount before VAT
        const getTotalBeforeVAT = () => {
            if (!receipt.product_variants || receipt.product_variants.length === 0) return 0;
            return receipt.product_variants.reduce((sum, item) => {
                return sum + getAmountBeforeVAT(item);
            }, 0);
        };

        return (
            <div
                ref={ref}
                className="bg-white text-black"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "15mm",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "13px",
                    lineHeight: "1.4",
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div style={{ width: "60%", fontSize: "12px" }}>
                        <p className="font-bold uppercase">
                            {companyName || "______________________________"}
                        </p>

                        {officeAddress && <p>{officeAddress}</p>}
                        {branchAddress && <p>{branchAddress}</p>}

                        {(phone || hotline) && (
                            <p>
                                {phone && `ĐT: ${phone}`}
                                {phone && hotline ? " - " : ""}
                                {hotline && `Hotline: ${hotline}`}
                            </p>
                        )}

                        {email && <p>Email: {email}</p>}
                        {website && <p>Website: {website}</p>}
                    </div>

                    <div
                        style={{ width: "35%", fontSize: "12px" }}
                        className="text-right"
                    >
                        <p className="font-bold">Mẫu số: 01 - VT</p>
                        <p className="italic" style={{ fontSize: "11px" }}>
                            (Ban hành theo Thông tư số 133/2016/TT-BTC
                        </p>
                        <p className="italic" style={{ fontSize: "11px" }}>
                            Ngày 26/08/2016 của Bộ Tài chính)
                        </p>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold uppercase mb-2">
                        PHIẾU NHẬP KHO
                    </h1>
                    <p className="italic mb-1">
                        {formatDateFull(receipt.receipt_date || new Date())}
                    </p>
                    <p className="mb-1">Số: {receipt.code || "___________"}</p>
                </div>

                {/* Accounting info */}
                <div
                    className="flex justify-end mb-4"
                    style={{ fontSize: "12px" }}
                >
                    <div className="text-right">
                        <p>Nợ: 156</p>
                        <p>Có: 331</p>
                    </div>
                </div>

                {/* Supplier info */}
                <div className="mb-4" style={{ fontSize: "13px" }}>
                    <p className="mb-1">
                        - Họ và tên người giao:{" "}
                        <span className="uppercase font-semibold">
                            {receipt.supplier_info?.name ||
                                receipt.supplier_name ||
                                "___________________________________"}
                        </span>
                    </p>
                    <p className="mb-1">
                        - Theo hóa đơn số{" "}
                        <span className="font-semibold">
                            {receipt.invoice_number || "________"}
                        </span>{" "}
                        ngày {formatDate(receipt.receipt_date || new Date())}{" "}
                        của{" "}
                        <span className="uppercase font-semibold">
                            {receipt.supplier_info?.name ||
                                receipt.supplier_name ||
                                "___________________________________"}
                        </span>
                    </p>
                    <p>
                        - Nhập tại kho:{" "}
                        <span className="font-semibold">
                            {receipt.warehouse_name || "Kho NVL"}
                        </span>
                        <span className="ml-20">
                            Địa điểm:{" "}
                            {receipt.warehouse_location ||
                                "___________________"}
                        </span>
                    </p>
                </div>

                {/* Product table */}
                <table
                    className="w-full border-collapse mb-4"
                    style={{ fontSize: "12px", border: "1px solid black" }}
                >
                    <thead>
                        <tr>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "40px" }}
                                rowSpan={2}
                            >
                                STT
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                rowSpan={2}
                            >
                                Tên, nhãn hiệu, quy cách,
                                <br />
                                phẩm chất vật tư, dụng cụ
                                <br />
                                sản phẩm, hàng hóa
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "80px" }}
                                rowSpan={2}
                            >
                                Mã số
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "60px" }}
                                rowSpan={2}
                            >
                                Đơn vị
                                <br />
                                tính
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                colSpan={2}
                            >
                                Số lượng
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "90px" }}
                                rowSpan={2}
                            >
                                Đơn giá
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "100px" }}
                                rowSpan={2}
                            >
                                Thành tiền
                            </th>
                        </tr>
                        <tr>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "60px" }}
                            >
                                Theo
                                <br />
                                chứng từ
                            </th>
                            <th
                                className="border border-black p-1 text-center font-bold"
                                style={{ width: "60px" }}
                            >
                                Thực
                                <br />
                                nhập
                            </th>
                        </tr>
                        <tr>
                            <th className="border border-black p-1 text-center font-bold">
                                A
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                B
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                C
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                D
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                1
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                2
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                3
                            </th>
                            <th className="border border-black p-1 text-center font-bold">
                                4
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.product_variants?.length > 0 ? (
                            receipt.product_variants.map((item, index) => (
                                <tr key={index}>
                                    <td className="border border-black p-1 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="border border-black p-1">
                                        {item.name || item.product_name || ""}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {getProductCode(item)}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {getUnitName(item)}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {formatMoney(item.quantity || 0)}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {/* Thực nhập để trống */}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {formatMoney(item.price || 0)}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {formatMoney(getAmountBeforeVAT(item))}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="border border-black p-2 text-center"
                                >
                                    Chưa có sản phẩm
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td
                                colSpan="4"
                                className="border border-black p-1 text-center font-bold"
                            >
                                Cộng
                            </td>
                            <td className="border border-black p-1 text-right font-bold">
                                {formatMoney(getTotalQuantity())}
                            </td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1 text-right font-bold">
                                {formatMoney(getTotalBeforeVAT())}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Total in words */}
                <div className="mb-6" style={{ fontSize: "13px" }}>
                    <p>
                        - Tổng số tiền (Viết bằng chữ):{" "}
                        <span className="italic font-semibold">
                            {numberToVietnameseText(getTotalBeforeVAT())}
                        </span>
                    </p>
                    <p>
                        - Số chứng từ gốc kèm theo:{" "}
                        <span className="underline">
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </span>
                    </p>
                </div>

                {/* Signatures */}
                <div className="text-right mb-2" style={{ fontSize: "13px" }}>
                    <p className="italic">
                        {formatDateFull(receipt.receipt_date || new Date())}
                    </p>
                </div>

                <div
                    className="grid grid-cols-4 gap-4 text-center"
                    style={{ fontSize: "12px" }}
                >
                    <div>
                        <p className="font-bold mb-1">Người lập phiếu</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Người giao hàng</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Thủ kho</p>
                        <p className="italic text-xs mb-16">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Kế toán trưởng</p>
                        <p className="italic text-xs">
                            (Hoặc bộ phận có nhu cầu nhập)
                        </p>
                        <p className="italic text-xs mb-12">(Ký, họ tên)</p>
                    </div>
                </div>
            </div>
        );
    },
);

PurchaseReceiptPrint.displayName = "PurchaseReceiptPrint";

export default PurchaseReceiptPrint;