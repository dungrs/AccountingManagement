import React, { forwardRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PurchaseReceiptPrint = forwardRef(
    ({ receipt, totals, user }, ref) => {
        // Format date safely
        console.log(receipt.product_variants)
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

        // Convert number to Vietnamese text
        const numberToVietnameseText = (num) => {
            if (!num || num === 0) return "Không đồng";
            
            const units = ["", "nghìn", "triệu", "tỷ"];
            const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
            
            const readGroup = (group) => {
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
                    else if (unit > 0) result += digits[unit] + " ";
                } else if (ten === 1) {
                    result += "mười ";
                    if (unit > 0) result += digits[unit] + " ";
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
                    result = readGroup(group) + " " + units[unitIndex] + " " + result;
                }
                n = Math.floor(n / 1000);
                unitIndex++;
            }

            return result.trim().charAt(0).toUpperCase() + result.trim().slice(1) + " đồng chẵn.";
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
                            CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ CÔNG NGHỆ VIỆT HƯNG
                        </p>
                        <p>
                            Số 2, ngách 84/2 đường Trần Quang Diệu, Phường ô Chợ Dừa,
                        </p>
                        <p>Quận Đống đa, Thành phố Hà Nội, Việt Nam</p>
                    </div>
                    <div style={{ width: "35%", fontSize: "12px" }} className="text-right">
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
                    <p className="mb-1">Số: {receipt.code}</p>
                </div>

                {/* Accounting info */}
                <div className="flex justify-end mb-4" style={{ fontSize: "12px" }}>
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
                            {receipt.supplier_info?.name || "___________________________________"}
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
                            {receipt.supplier_info?.name || "___________________________________"}
                        </span>
                    </p>
                    <p>
                        - Nhập tại kho:{" "}
                        <span className="font-semibold">
                            {receipt.warehouse_name || "Kho NVL"}
                        </span>
                        <span className="ml-20">
                            Địa điểm: {receipt.warehouse_location || "___________________"}
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
                                        {item.name || ""}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {item.sku || item.barcode || ""}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {item.unit || "Cái"}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {(item.quantity || 0)}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {/* Thực nhập để trống */}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {(item.price || 0).toLocaleString("vi-VN")}
                                    </td>
                                    <td className="border border-black p-1 text-right">
                                        {(item.subtotal || 0).toLocaleString("vi-VN")}
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
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1 text-right font-bold">
                                {(totals.grandTotal || 0).toLocaleString("vi-VN")}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Total in words */}
                <div className="mb-6" style={{ fontSize: "13px" }}>
                    <p>
                        - Tổng số tiền (Viết bằng chữ):{" "}
                        <span className="italic font-semibold">
                            {numberToVietnameseText(totals.grandTotal || 0)}
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
                        <p className="mt-12">{user?.name || ""}</p>
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
                        <p className="italic text-xs">(Hoặc bộ phận có nhu cầu nhập)</p>
                        <p className="italic text-xs mb-12">(Ký, họ tên)</p>
                    </div>
                </div>
            </div>
        );
    }
);

PurchaseReceiptPrint.displayName = "PurchaseReceiptPrint";

export default PurchaseReceiptPrint;