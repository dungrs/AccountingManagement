<?php

namespace App\Services\Voucher;

use App\Services\Interfaces\Voucher\ReceiptVoucherServiceInterface;
use App\Services\BaseService;
use App\Repositories\Voucher\ReceiptVoucherRepository;
use App\Services\JournalEntryService;
use App\Services\Debt\CustomerDebtService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReceiptVoucherService extends BaseService implements ReceiptVoucherServiceInterface
{
    protected $receiptVoucherRepository;
    protected $journalEntryService;
    protected $customerDebtService;

    public function __construct(
        ReceiptVoucherRepository $receiptVoucherRepository,
        JournalEntryService $journalEntryService,
        CustomerDebtService $customerDebtService
    ) {
        $this->receiptVoucherRepository = $receiptVoucherRepository;
        $this->journalEntryService = $journalEntryService;
        $this->customerDebtService = $customerDebtService;
    }

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;

        $status = $request->input('status');
        $payment_method = $request->input('payment_method');

        $where = [];

        if (!empty($status) && $status !== 'all') {
            $where[] = ['receipt_vouchers.status', '=', $status];
        }

        if (!empty($payment_method) && $payment_method !== 'all') {
            $where[] = ['receipt_vouchers.payment_method', '=', $payment_method];
        }

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'where' => $where
        ];

        $extend = [
            'path' => '/voucher/receipt/index',
            'fieldSearch' => [
                'receipt_vouchers.code',
                'receipt_vouchers.note',
                'customers.name',
            ],
        ];

        $join = [
            [
                'table' => 'customers',
                'on' => [
                    ['customers.id', 'receipt_vouchers.customer_id'],
                ],
            ],
        ];

        return $this->receiptVoucherRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['receipt_vouchers.id', 'DESC'],
            $join
        );
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $payload = $request->only($this->payload());

            // Map partner_id thành customer_id
            if ($request->has('partner_id')) {
                $payload['customer_id'] = $request->input('partner_id');
            }

            // Xử lý user_id
            $payload['user_id'] = $request->input('user_id') ?? Auth::id();
            $payload['created_by'] = $payload['user_id'];

            // Tạo mã nếu không có code từ request
            if (empty($payload['code'])) {
                $payload['code'] = $this->generateReceiptVoucherCode();
            }

            $voucher = $this->receiptVoucherRepository->create($payload);

            // Tạo journal entries cho cả draft và confirmed
            if ($request->has('journal_entries')) {
                $this->journalEntryService->createFromRequest(
                    'receipt_voucher',
                    $voucher->id,
                    $request->input('journal_entries'),
                    $voucher->voucher_date
                );
            }

            // Xử lý khi xác nhận - chỉ tạo công nợ
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($voucher);
            }

            return $voucher;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $voucher = $this->receiptVoucherRepository->findByCondition(
                [['id', '=', $id]],
                false,
                [],
                [],
                ['*'],
                ['journalEntries']
            );

            if (!$voucher) {
                throw new \Exception('Phiếu thu không tồn tại.');
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

                // Map partner_id thành customer_id
                if ($request->has('partner_id')) {
                    $payload['customer_id'] = $request->input('partner_id');
                }

                // Xử lý user_id
                $payload['user_id'] = $request->input('user_id') ?? Auth::id();

                // Không cho phép sửa code khi update
                unset($payload['code']);

                $this->receiptVoucherRepository->update($id, $payload);

                // Cập nhật journal entries
                if ($request->has('journal_entries')) {
                    $this->journalEntryService->updateJournalByReference(
                        'receipt_voucher',
                        $voucher->id,
                        $request->input('journal_entries'),
                        $voucher->voucher_date
                    );
                }

                // Nếu từ draft → confirmed
                if ($newStatus === 'confirmed') {
                    $voucher = $this->receiptVoucherRepository->findById($id);
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
            $receiptVoucher = $this->receiptVoucherRepository->findById($id);

            if (!$receiptVoucher) {
                throw new \Exception('Phiếu thu không tồn tại.');
            }

            // Xóa journal entries (cho cả draft và confirmed)
            $this->journalEntryService->deleteJournalByReference('receipt_voucher', $receiptVoucher->id);

            // Xóa công nợ nếu đã confirmed
            if ($receiptVoucher->status === 'confirmed') {
                $this->customerDebtService->deleteDebtByReference('receipt_voucher', $receiptVoucher->id);
            }

            $receiptVoucher->delete();

            return true;
        });
    }

    private function handleConfirm($voucher)
    {
        // Tạo công nợ (ghi giảm công nợ khách hàng - credit)
        $this->customerDebtService->createDebtForReceiptVoucher($voucher);

        // Xác nhận journal entries (nếu cần)
        $this->journalEntryService->confirmJournalByReference('receipt_voucher', $voucher->id);
    }

    private function handleCancel($voucher)
    {
        // Xoá công nợ
        $this->customerDebtService->deleteDebtByReference('receipt_voucher', $voucher->id);

        // Xoá định khoản
        $this->journalEntryService->deleteJournalByReference('receipt_voucher', $voucher->id);
    }

    public function getReceiptVoucherDetail($id)
    {
        $receiptVoucher = $this->receiptVoucherRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            [
                'customer',
                'user',
                'journalEntries' => function ($query) {
                    $query->with(['details.account.languages']);
                },
                'customerDebts'
            ]
        );

        if (!$receiptVoucher) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Format User
        |--------------------------------------------------------------------------
        */
        $receiptVoucher->user_info = $receiptVoucher->user ? [
            'id' => $receiptVoucher->user->id,
            'name' => $receiptVoucher->user->name,
            'email' => $receiptVoucher->user->email,
        ] : null;

        /*
        |--------------------------------------------------------------------------
        | Format Customer (không có banks)
        |--------------------------------------------------------------------------
        */
        $receiptVoucher->customer_info = [
            'customer_id'   => $receiptVoucher->customer?->id,
            'name'          => $receiptVoucher->customer?->name,
            'tax_code'      => $receiptVoucher->customer?->tax_code ?? null,
            'phone'         => $receiptVoucher->customer?->phone,
            'email'         => $receiptVoucher->customer?->email,
            'address'       => $receiptVoucher->customer?->address,
        ];

        /*
        |--------------------------------------------------------------------------
        | Format Journal Entries
        |--------------------------------------------------------------------------
        */
        $receiptVoucher->journal_entries = $receiptVoucher->journalEntries->isNotEmpty()
            ? $receiptVoucher->journalEntries->map(function ($journal) {
                return [
                    'id'         => $journal->id,
                    'code'       => $journal->code,
                    'entry_date' => $journal->entry_date,
                    'note'       => $journal->note,
                    'created_by' => $journal->created_by,
                    'details'    => $journal->details->map(function ($detail) {
                        return [
                            'account_code' => $detail->account?->account_code,
                            'account_name' => $detail->account?->name,
                            'debit'        => $detail->debit,
                            'credit'       => $detail->credit,
                        ];
                    })->values()->toArray()
                ];
            })->values()->toArray()
            : [];

        /*
        |--------------------------------------------------------------------------
        | Format Customer Debt
        |--------------------------------------------------------------------------
        */
        $totalDebit = 0;
        $totalCredit = 0;

        if ($receiptVoucher->customerDebts->isNotEmpty()) {
            foreach ($receiptVoucher->customerDebts as $debt) {
                $totalDebit += $debt->debit ?? 0;
                $totalCredit += $debt->credit ?? 0;
            }
        }

        $receiptVoucher->debt = [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalDebit - $totalCredit,
            'details'      => $receiptVoucher->customerDebts->isNotEmpty()
                ? $receiptVoucher->customerDebts->map(function ($debt) {
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
        | Thêm thông tin tổng hợp
        |--------------------------------------------------------------------------
        */
        $receiptVoucher->summary = [
            'payment_method_name' => $this->getPaymentMethodName($receiptVoucher->payment_method),
            'created_by_name' => $receiptVoucher->created_by ? optional($receiptVoucher->user)->name : null,
        ];

        /*
        |--------------------------------------------------------------------------
        | Cleanup - xóa các relation không cần thiết
        |--------------------------------------------------------------------------
        */
        unset($receiptVoucher->journalEntries);
        unset($receiptVoucher->customerDebts);
        unset($receiptVoucher->customer);
        unset($receiptVoucher->user);

        return $receiptVoucher;
    }

    /**
     * Lấy tên phương thức thanh toán
     */
    private function getPaymentMethodName($method)
    {
        $methods = [
            'cash' => 'Tiền mặt',
            'bank' => 'Chuyển khoản'
        ];

        return $methods[$method] ?? $method;
    }

    /**
     * Tự động generate mã phiếu thu duy nhất
     * Format: PT_YYYYMMDD_HHMMSS (dựa trên thời gian hiện tại)
     */
    private function generateReceiptVoucherCode()
    {
        do {
            // Tạo mã dựa trên thời gian: PT_YYYYMMDD_HHMMSS
            $code = 'PT_' . now()->format('Ymd_His');

            // Kiểm tra xem mã đã tồn tại chưa
            $exists = $this->receiptVoucherRepository->findByCondition(
                [['code', '=', $code]],
                false
            );

            // Nếu đã tồn tại, chờ 1 giây để tạo mã mới
            if ($exists) {
                sleep(1);
                now()->refresh();
            }
        } while ($exists);

        return $code;
    }

    private function paginateSelect()
    {
        return [
            'receipt_vouchers.id',
            'receipt_vouchers.code',
            'receipt_vouchers.voucher_date',
            'receipt_vouchers.customer_id',
            'customers.name as customer_name',
            'receipt_vouchers.payment_method',
            'receipt_vouchers.note',
            'receipt_vouchers.status',
            'receipt_vouchers.amount',
            'receipt_vouchers.user_id',
        ];
    }

    private function payload()
    {
        return [
            'code',
            'voucher_date',
            'customer_id',
            'user_id',
            'amount',
            'payment_method',
            'note',
            'status',
        ];
    }
}