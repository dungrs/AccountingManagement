<?php

namespace App\Services\Voucher;

use App\Services\Interfaces\Voucher\PaymentVoucherServiceInterface;
use App\Services\BaseService;
use App\Repositories\Voucher\PaymentVoucherRepository;
use App\Services\JournalEntryService;
use App\Services\Debt\SupplierDebtService;
use App\Models\SupplierBankAccount;
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

            // Map partner_id thành supplier_id
            if ($request->has('partner_id')) {
                $payload['supplier_id'] = $request->input('partner_id');
            }

            // Map voucher_date
            if ($request->has('voucher_date')) {
                $payload['voucher_date'] = $request->input('voucher_date');
            }

            // Xử lý user_id
            $payload['user_id'] = Auth::id() ?? $request->input('user_id');

            if (empty($payload['code'])) {
                $payload['code'] = $this->generatePaymentVoucherCode();
            }

            $voucher = $this->paymentVoucherRepository->create($payload);

            // SỬA: Tạo journal entries cho cả draft và confirmed
            if ($request->has('journal_entries')) {
                $this->journalEntryService->createFromRequest(
                    'payment_voucher',
                    $voucher->id,
                    $request->input('journal_entries'),
                    $voucher->voucher_date
                );
            }

            // SỬA: Chỉ tạo công nợ khi status là confirmed
            if ($payload['status'] === 'confirmed') {
                $this->supplierDebtService->createDebtForPaymentVoucher($voucher);
            }

            return $voucher;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $voucher = $this->paymentVoucherRepository->findById($id);

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
                    // SỬA: Xóa công nợ nhưng giữ lại journal entries
                    $this->supplierDebtService->deleteDebtByReference('payment_voucher', $voucher->id);

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

                // Map partner_id thành supplier_id
                if ($request->has('partner_id')) {
                    $payload['supplier_id'] = $request->input('partner_id');
                }

                // Map voucher_date
                if ($request->has('voucher_date')) {
                    $payload['voucher_date'] = $request->input('voucher_date');
                }

                // Xử lý user_id
                $payload['user_id'] = Auth::id() ?? $request->input('user_id');

                $this->paymentVoucherRepository->update($id, $payload);

                // SỬA: Cập nhật journal entries
                if ($request->has('journal_entries')) {
                    // Xóa journal entries cũ
                    $this->journalEntryService->deleteJournalByReference('payment_voucher', $voucher->id);

                    // Tạo journal entries mới
                    $this->journalEntryService->createFromRequest(
                        'payment_voucher',
                        $voucher->id,
                        $request->input('journal_entries'),
                        $voucher->voucher_date
                    );
                }

                // SỬA: Xử lý chuyển từ draft sang confirmed
                if ($newStatus === 'confirmed') {
                    // Tạo công nợ
                    $this->supplierDebtService->createDebtForPaymentVoucher($voucher);
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

            // SỬA: Xóa journal entries và công nợ (nếu có)
            // Xóa journal entries (cho cả draft và confirmed)
            $this->journalEntryService->deleteJournalByReference('payment_voucher', $paymentVoucher->id);

            // Xóa công nợ (nếu có)
            if ($paymentVoucher->status === 'confirmed') {
                $this->supplierDebtService->deleteDebtByReference('payment_voucher', $paymentVoucher->id);
            }

            $paymentVoucher->delete();

            return true;
        });
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
                            'debit'        => $detail->debit,
                            'credit'       => $detail->credit,
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
            'balance'      => $totalDebit - $totalCredit,
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

    private function generatePaymentVoucherCode()
    {
        $latest = $this->paymentVoucherRepository->findLastest();

        if (!$latest || !$latest->code) {
            return 'PC_001';
        }

        $latestCode = $latest->code;
        preg_match('/(\d+)/', $latestCode, $matches);

        $number = isset($matches[1]) ? (int)$matches[1] + 1 : 1;

        return 'PC_' . str_pad($number, 3, '0', STR_PAD_LEFT);
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