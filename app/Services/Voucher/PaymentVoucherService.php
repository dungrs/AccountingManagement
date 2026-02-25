<?php

namespace App\Services\Voucher;

use App\Services\Interfaces\Voucher\PaymentVoucherServiceInterface;
use App\Services\BaseService;
use App\Repositories\Voucher\PaymentVoucherRepository;
use App\Services\JournalEntryService;
use App\Services\Debt\SupplierDebtService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentVoucherService extends BaseService implements PaymentVoucherServiceInterface
{
    protected $paymentVoucherRepository;
    protected $journalEntryService;
    protected $supplierDebtService;

    public function __construct(
        PaymentVoucherRepository $paymentVoucherRepository,
        JournalEntryService $journalEntryService,
        SupplierDebtService $supplierDebtService
    ) {
        $this->paymentVoucherRepository = $paymentVoucherRepository;
        $this->journalEntryService = $journalEntryService;
        $this->supplierDebtService = $supplierDebtService;
    }

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;

        $status = $request->input('status');
        $payment_method = $request->input('payment_method');

        $where = [];

        if (!empty($status) && $status !== 'all') {
            $where[] = ['payment_vouchers.status', '=', $status];
        }

        if (!empty($payment_method) && $payment_method !== 'all') {
            $where[] = ['payment_vouchers.payment_method', '=', $payment_method];
        }

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'where' => $where
        ];

        $extend = [
            'path' => '/voucher/payment/index',
            'fieldSearch' => [
                'payment_vouchers.code',
                'payment_vouchers.note',
                'suppliers.name',
            ],
        ];

        $join = [
            [
                'table' => 'suppliers',
                'on' => [
                    ['suppliers.id', 'payment_vouchers.supplier_id'],
                ],
            ],
        ];

        return $this->paymentVoucherRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['payment_vouchers.id', 'DESC'],
            $join
        );
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $payload = $request->only($this->payload());

            // Map supplier_id
            if ($request->has('supplier_id')) {
                $payload['supplier_id'] = $request->input('supplier_id');
            }

            // Xử lý user_id
            $payload['user_id'] = $request->input('user_id') ?? Auth::id();
            $payload['created_by'] = $payload['user_id'];

            // Xử lý amount
            $payload['amount'] = $this->parseAmount($request->input('amount'));

            // Tạo mã nếu không có code từ request
            if (empty($payload['code'])) {
                $payload['code'] = $this->generatePaymentVoucherCode();
            }

            $voucher = $this->paymentVoucherRepository->create($payload);

            // Tạo journal entries
            if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                $journalData = $this->prepareJournalData($request->input('journal_entries'));

                $this->journalEntryService->createFromRequest(
                    'payment_voucher',
                    $voucher->id,
                    $journalData,
                    $voucher->voucher_date
                );
            }

            // Xử lý khi xác nhận
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($voucher);
            }

            return $voucher;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $voucher = $this->paymentVoucherRepository->findByCondition(
                [['id', '=', $id]],
                false,
                [],
                [],
                ['*'],
                ['journalEntries']
            );

            if (!$voucher) {
                throw new \Exception('Phiếu chi không tồn tại.');
            }

            if ($voucher->status === 'cancelled') {
                throw new \Exception('Phiếu đã hủy không thể chỉnh sửa.');
            }

            $newStatus = $request->input('status');

            /*
            |--------------------------------------------------------------------------
            | Nếu đang CONFIRMED
            |--------------------------------------------------------------------------
            */
            if ($voucher->status === 'confirmed') {

                // Chỉ cho phép hủy
                if ($newStatus === 'cancelled') {
                    $this->handleCancel($voucher);
                    $voucher->update(['status' => 'cancelled']);
                    return true;
                }

                throw new \Exception('Phiếu đã xác nhận không thể chỉnh sửa.');
            }

            /*
            |--------------------------------------------------------------------------
            | Nếu đang DRAFT
            |--------------------------------------------------------------------------
            */
            if ($voucher->status === 'draft') {
                $payload = $request->only($this->payload());

                // Map supplier_id
                if ($request->has('supplier_id')) {
                    $payload['supplier_id'] = $request->input('supplier_id');
                }

                // Xử lý user_id
                $payload['user_id'] = $request->input('user_id') ?? Auth::id();

                // Xử lý amount
                $payload['amount'] = $this->parseAmount($request->input('amount'));

                // Không cho phép sửa code khi update
                unset($payload['code']);

                $this->paymentVoucherRepository->update($id, $payload);

                // Cập nhật journal entries
                if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                    $journalData = $this->prepareJournalData($request->input('journal_entries'));

                    $this->journalEntryService->updateJournalByReference(
                        'payment_voucher',
                        $voucher->id,
                        $journalData,
                        $voucher->voucher_date
                    );
                } else {
                    // Nếu không có journal entries, xóa định khoản cũ
                    $this->journalEntryService->deleteJournalByReference('payment_voucher', $voucher->id);
                }

                // Nếu từ draft → confirmed
                if ($newStatus === 'confirmed') {
                    $voucher = $this->paymentVoucherRepository->findById($id);
                    $this->handleConfirm($voucher);
                }

                return true;
            }

            return false;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $paymentVoucher = $this->paymentVoucherRepository->findById($id);

            if (!$paymentVoucher) {
                throw new \Exception('Phiếu chi không tồn tại.');
            }

            // Xóa journal entries
            $this->journalEntryService->deleteJournalByReference('payment_voucher', $paymentVoucher->id);

            // Xóa công nợ nếu đã confirmed
            if ($paymentVoucher->status === 'confirmed') {
                $this->supplierDebtService->deleteDebtByReference('payment_voucher', $paymentVoucher->id);
            }

            $paymentVoucher->delete();

            return true;
        });
    }

    /**
     * Xử lý khi xác nhận phiếu chi
     */
    private function handleConfirm($voucher)
    {
        // Tạo công nợ (ghi nhận đã thanh toán)
        $this->supplierDebtService->createDebtForPaymentVoucher($voucher);

        // Xác nhận journal entries
        $this->journalEntryService->confirmJournalByReference('payment_voucher', $voucher->id);
    }

    /**
     * Xử lý khi hủy phiếu chi
     */
    private function handleCancel($voucher)
    {
        // Xóa công nợ
        $this->supplierDebtService->deleteDebtByReference('payment_voucher', $voucher->id);

        // Xóa định khoản
        $this->journalEntryService->deleteJournalByReference('payment_voucher', $voucher->id);
    }

    /**
     * Chuẩn bị dữ liệu journal entries từ request
     */
    private function prepareJournalData($journalEntries)
    {
        // Nếu journalEntries đã có cấu trúc {entries: [...], note: '...'}
        if (isset($journalEntries['entries']) && is_array($journalEntries['entries'])) {
            return $journalEntries;
        }

        // Nếu journalEntries là mảng các entry đơn thuần
        if (is_array($journalEntries) && !isset($journalEntries['entries'])) {
            return [
                'entries' => $journalEntries,
                'note' => request()->input('journal_note') ?? 'Bút toán từ phiếu chi',
            ];
        }

        return $journalEntries;
    }

    /**
     * Parse amount từ string sang float
     */
    private function parseAmount($amount)
    {
        if (is_numeric($amount)) {
            return (float) $amount;
        }

        // Xóa dấu phân cách hàng nghìn (nếu có)
        $cleaned = preg_replace('/[^\d]/', '', $amount);
        return (float) $cleaned;
    }

    public function getPaymentVoucherDetail($id)
    {
        $paymentVoucher = $this->paymentVoucherRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            [
                'supplier',
                'user',
                'supplierBankAccount.bank',
                'journalEntries' => function ($query) {
                    $query->with(['details.account.languages']);
                },
                'supplierDebts'
            ]
        );

        if (!$paymentVoucher) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Format User
        |--------------------------------------------------------------------------
        */
        $paymentVoucher->user_info = $paymentVoucher->user ? [
            'id' => $paymentVoucher->user->id,
            'name' => $paymentVoucher->user->name,
            'email' => $paymentVoucher->user->email,
        ] : null;

        /*
        |--------------------------------------------------------------------------
        | Format Supplier + Banks
        |--------------------------------------------------------------------------
        */
        $paymentVoucher->supplier_info = [
            'id'            => $paymentVoucher->supplier?->id,
            'supplier_code' => $paymentVoucher->supplier?->supplier_code,
            'name'          => $paymentVoucher->supplier?->name,
            'tax_code'      => $paymentVoucher->supplier?->tax_code,
            'phone'         => $paymentVoucher->supplier?->phone,
            'email'         => $paymentVoucher->supplier?->email,
            'address'       => $paymentVoucher->supplier?->address,
            'banks'         => $paymentVoucher->supplier?->banks
                ? $paymentVoucher->supplier->banks->map(function ($bank) {
                    return [
                        'id'             => $bank->id,
                        'bank_code'      => $bank->bank_code,
                        'name'           => $bank->name,
                        'short_name'     => $bank->short_name,
                        'swift_code'     => $bank->swift_code,
                        'account_number' => $bank->pivot?->account_number,
                    ];
                })->values()->toArray()
                : [],
        ];

        /*
        |--------------------------------------------------------------------------
        | Format Supplier Bank Account
        |--------------------------------------------------------------------------
        */
        $paymentVoucher->supplier_bank_account_info = $paymentVoucher->supplierBankAccount ? [
            'id' => $paymentVoucher->supplierBankAccount->id,
            'supplier_code' => $paymentVoucher->supplierBankAccount->supplier_code,
            'bank_code' => $paymentVoucher->supplierBankAccount->bank_code,
            'bank_name' => $paymentVoucher->supplierBankAccount->bank?->name,
            'account_number' => $paymentVoucher->supplierBankAccount->account_number,
        ] : null;

        /*
        |--------------------------------------------------------------------------
        | Format Journal Entries
        |--------------------------------------------------------------------------
        */
        $paymentVoucher->journal_entries = $paymentVoucher->journalEntries->isNotEmpty()
            ? $paymentVoucher->journalEntries->map(function ($journal) {
                return [
                    'id'         => $journal->id,
                    'code'       => $journal->code,
                    'entry_date' => $journal->entry_date,
                    'note'       => $journal->note,
                    'created_by' => $journal->created_by,
                    'details'    => $journal->details->map(function ($detail) {
                        return [
                            'account_code' => $detail->account?->account_code,
                            'debit'        => (float)$detail->debit,
                            'credit'       => (float)$detail->credit,
                        ];
                    })->values()->toArray()
                ];
            })->values()->toArray()
            : [];

        /*
        |--------------------------------------------------------------------------
        | Format Supplier Debt
        |--------------------------------------------------------------------------
        */
        $totalDebit = 0;
        $totalCredit = 0;

        if ($paymentVoucher->supplierDebts->isNotEmpty()) {
            foreach ($paymentVoucher->supplierDebts as $debt) {
                $totalDebit += $debt->debit ?? 0;
                $totalCredit += $debt->credit ?? 0;
            }
        }

        $paymentVoucher->debt = [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalCredit - $totalDebit, // Công nợ phải trả = credit - debit
            'details'      => $paymentVoucher->supplierDebts->isNotEmpty()
                ? $paymentVoucher->supplierDebts->map(function ($debt) {
                    return [
                        'id'               => $debt->id,
                        'transaction_date' => $debt->transaction_date,
                        'debit'            => $debt->debit,
                        'credit'           => $debt->credit,
                        'reference_type'   => $debt->reference_type,
                        'reference_id'     => $debt->reference_id,
                    ];
                })->values()->toArray()
                : [],
        ];

        /*
        |--------------------------------------------------------------------------
        | Cleanup
        |--------------------------------------------------------------------------
        */
        unset($paymentVoucher->journalEntries);
        unset($paymentVoucher->supplierDebts);
        unset($paymentVoucher->supplier);
        unset($paymentVoucher->user);
        unset($paymentVoucher->supplierBankAccount);

        return $paymentVoucher;
    }

    /**
     * Tự động generate mã phiếu chi duy nhất
     * Format: PC_YYYYMMDD_HHMMSS
     */
    private function generatePaymentVoucherCode()
    {
        do {
            $code = 'PC_' . now()->format('Ymd_His');
            $exists = $this->paymentVoucherRepository->findByCondition(
                [['code', '=', $code]],
                false
            );
            if ($exists) {
                sleep(1);
                now()->refresh();
            }
        } while ($exists);

        return $code;
    }

    /**
     * Lấy danh sách phiếu chi chưa thanh toán cho nhà cung cấp
     */
    public function getUnpaidVouchers($supplierId)
    {
        return $this->paymentVoucherRepository->findByCondition(
            [
                ['supplier_id', '=', $supplierId],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            ['voucher_date' => 'DESC', 'id' => 'DESC'],
            ['id', 'code', 'voucher_date', 'amount', 'note']
        );
    }

    private function paginateSelect()
    {
        return [
            'payment_vouchers.id',
            'payment_vouchers.code',
            'payment_vouchers.voucher_date',
            'payment_vouchers.supplier_id',
            'suppliers.name as supplier_name',
            'payment_vouchers.payment_method',
            'payment_vouchers.note',
            'payment_vouchers.status',
            'payment_vouchers.amount',
            'payment_vouchers.user_id',
            'payment_vouchers.supplier_bank_account_id',
        ];
    }

    private function payload()
    {
        return [
            'code',
            'voucher_date',
            'supplier_id',
            'user_id',
            'supplier_bank_account_id',
            'amount',
            'payment_method',
            'note',
            'status',
        ];
    }
}