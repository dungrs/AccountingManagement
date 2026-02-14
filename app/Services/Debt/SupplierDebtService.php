<?php

namespace App\Services\Debt;

use App\Repositories\Debt\SupplierDebtRepository;
use App\Services\BaseService;
use App\Services\Interfaces\Debt\SupplierDebtServiceInterface;

class SupplierDebtService extends BaseService implements SupplierDebtServiceInterface
{
    protected $supplierDebtRepository;

    public function __construct(SupplierDebtRepository $supplierDebtRepository)
    {
        $this->supplierDebtRepository = $supplierDebtRepository;
    }

    /**
     * Tạo công nợ khi nhập hàng (tăng nợ)
     */
    public function createDebtForPurchaseReceipt($receipt)
    {
        return $this->supplierDebtRepository->create([
            'supplier_id'      => $receipt->supplier_id,
            'reference_type'   => 'purchase_receipt',
            'reference_id'     => $receipt->id,
            'debit'            => $receipt->grand_total,
            'credit'           => 0,
            'transaction_date' => now(),
        ]);
    }

    /**
     * Tạo công nợ khi thanh toán (giảm nợ)
     */
    public function createDebtForPaymentVoucher($paymentVoucher)
    {
        return $this->supplierDebtRepository->create([
            'supplier_id'      => $paymentVoucher->supplier_id,
            'reference_type'   => 'payment_voucher',
            'reference_id'     => $paymentVoucher->id,
            'debit'            => 0,
            'credit'           => $paymentVoucher->amount,
            'transaction_date' => now(),
        ]);
    }

    /**
     * Xóa công nợ theo reference
     */
    public function deleteDebtByReference($referenceType, $referenceId)
    {
        return $this->supplierDebtRepository->deleteByCondition([
            ['reference_type', '=', $referenceType],
            ['reference_id', '=', $referenceId]
        ]);
    }

    /**
     * Lấy tổng công nợ của nhà cung cấp
     */
    public function getSupplierDebtBalance($supplierId)
    {
        $debts = $this->supplierDebtRepository->findByCondition(
            [['supplier_id', '=', $supplierId]],
            true // get all
        );

        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($debts as $debt) {
            $totalDebit += $debt->debit ?? 0;
            $totalCredit += $debt->credit ?? 0;
        }

        return [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalDebit - $totalCredit,
        ];
    }
}