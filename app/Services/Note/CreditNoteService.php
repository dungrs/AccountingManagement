<?php

namespace App\Services\Note;

use App\Services\Interfaces\Note\CreditNoteServiceInterface;
use App\Services\BaseService;
use App\Repositories\Note\CreditNoteRepository;
use App\Services\JournalEntryService;
use App\Services\Debt\CustomerDebtService;
use App\Services\Debt\SupplierDebtService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CreditNoteService extends BaseService implements CreditNoteServiceInterface
{
    protected $creditNoteRepository;
    protected $journalEntryService;
    protected $customerDebtService;
    protected $supplierDebtService;

    public function __construct(
        CreditNoteRepository $creditNoteRepository,
        JournalEntryService $journalEntryService,
        CustomerDebtService $customerDebtService,
        SupplierDebtService $supplierDebtService
    ) {
        $this->creditNoteRepository = $creditNoteRepository;
        $this->journalEntryService = $journalEntryService;
        $this->customerDebtService = $customerDebtService;
        $this->supplierDebtService = $supplierDebtService;
    }

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;

        $status = $request->input('status');
        $type = $request->input('type');
        $partyType = $request->input('party_type');

        $where = [];

        if (!empty($status) && $status !== 'all') {
            $where[] = ['credit_notes.status', '=', $status];
        }

        if (!empty($type) && $type !== 'all') {
            $where[] = ['credit_notes.type', '=', $type];
        }

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'where' => $where
        ];

        $extend = [
            'path' => '/note/credit/index',
            'fieldSearch' => [
                'credit_notes.code',
                'credit_notes.reason',
                'credit_notes.note',
                'customers.name',
                'suppliers.name',
            ],
        ];

        $joins = [];

        if ($partyType === 'customer') {
            $joins[] = [
                'table' => 'customers',
                'on' => [
                    ['customers.id', 'credit_notes.customer_id'],
                ],
            ];
        } elseif ($partyType === 'supplier') {
            $joins[] = [
                'table' => 'suppliers',
                'on' => [
                    ['suppliers.id', 'credit_notes.supplier_id'],
                ],
            ];
        } else {
            $joins = [
                [
                    'table' => 'customers',
                    'on' => [
                        ['customers.id', 'credit_notes.customer_id'],
                    ],
                    'type' => 'left'
                ],
                [
                    'table' => 'suppliers',
                    'on' => [
                        ['suppliers.id', 'credit_notes.supplier_id'],
                    ],
                    'type' => 'left'
                ],
            ];
        }

        return $this->creditNoteRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['credit_notes.id', 'DESC'],
            $joins
        );
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $payload = $request->only($this->payload());

            // Xử lý customer_id hoặc supplier_id
            if ($request->has('customer_id')) {
                $payload['customer_id'] = $request->input('customer_id');
                $payload['supplier_id'] = null;
            }

            if ($request->has('supplier_id')) {
                $payload['supplier_id'] = $request->input('supplier_id');
                $payload['customer_id'] = null;
            }

            // Xử lý số tiền
            $payload['amount'] = $this->parseAmount($request->input('amount'));
            $payload['vat_rate'] = $request->input('vat_rate', 0);
            $payload['vat_amount'] = $payload['amount'] * $payload['vat_rate'] / 100;
            $payload['total_amount'] = $payload['amount'] + $payload['vat_amount'];

            // Xử lý user_id
            $payload['created_by'] = $request->input('user_id') ?? Auth::id();

            // Tạo mã nếu không có code từ request
            if (empty($payload['code'])) {
                $payload['code'] = $this->generateCreditNoteCode();
            }

            $creditNote = $this->creditNoteRepository->create($payload);

            // Tạo journal entries
            if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                $journalData = $this->prepareJournalData($request->input('journal_entries'));

                $this->journalEntryService->createFromRequest(
                    'credit_note',
                    $creditNote->id,
                    $journalData,
                    $creditNote->issue_date
                );
            }

            // Xử lý khi xác nhận
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($creditNote);
            }

            return $creditNote;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $creditNote = $this->creditNoteRepository->findByCondition(
                [['id', '=', $id]],
                false,
                [],
                [],
                ['*'],
                ['journalEntries']
            );

            if (!$creditNote) {
                throw new \Exception('Giấy báo có không tồn tại.');
            }

            if ($creditNote->status === 'cancelled') {
                throw new \Exception('Giấy báo có đã hủy không thể chỉnh sửa.');
            }

            $newStatus = $request->input('status');

            /*
            |--------------------------------------------------------------------------
            | Nếu đang CONFIRMED
            |--------------------------------------------------------------------------
            */
            if ($creditNote->status === 'confirmed') {

                if ($newStatus === 'cancelled') {
                    $this->handleCancel($creditNote);
                    $creditNote->update(['status' => 'cancelled']);
                    return true;
                }

                throw new \Exception('Giấy báo có đã xác nhận không thể chỉnh sửa.');
            }

            /*
            |--------------------------------------------------------------------------
            | Nếu đang DRAFT
            |--------------------------------------------------------------------------
            */
            if ($creditNote->status === 'draft') {
                $payload = $request->only($this->payload());

                // Xử lý customer_id hoặc supplier_id
                if ($request->has('customer_id')) {
                    $payload['customer_id'] = $request->input('customer_id');
                    $payload['supplier_id'] = null;
                }

                if ($request->has('supplier_id')) {
                    $payload['supplier_id'] = $request->input('supplier_id');
                    $payload['customer_id'] = null;
                }

                // Xử lý số tiền
                $payload['amount'] = $this->parseAmount($request->input('amount'));
                $payload['vat_rate'] = $request->input('vat_rate', 0);
                $payload['vat_amount'] = $payload['amount'] * $payload['vat_rate'] / 100;
                $payload['total_amount'] = $payload['amount'] + $payload['vat_amount'];

                unset($payload['code']);

                $this->creditNoteRepository->update($id, $payload);

                // Cập nhật journal entries
                if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                    $journalData = $this->prepareJournalData($request->input('journal_entries'));

                    $this->journalEntryService->updateJournalByReference(
                        'credit_note',
                        $creditNote->id,
                        $journalData,
                        $creditNote->issue_date
                    );
                } else {
                    $this->journalEntryService->deleteJournalByReference('credit_note', $creditNote->id);
                }

                if ($newStatus === 'confirmed') {
                    $creditNote = $this->creditNoteRepository->findById($id);
                    $this->handleConfirm($creditNote);
                }

                return true;
            }

            return false;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $creditNote = $this->creditNoteRepository->findById($id);

            if (!$creditNote) {
                throw new \Exception('Giấy báo có không tồn tại.');
            }

            $this->journalEntryService->deleteJournalByReference('credit_note', $creditNote->id);

            if ($creditNote->status === 'confirmed') {
                if ($creditNote->customer_id) {
                    $this->customerDebtService->deleteDebtByReference('credit_note', $creditNote->id);
                }
                if ($creditNote->supplier_id) {
                    $this->supplierDebtService->deleteDebtByReference('credit_note', $creditNote->id);
                }
            }

            $creditNote->delete();

            return true;
        });
    }

    /**
     * Xử lý khi xác nhận giấy báo có
     */
    private function handleConfirm($creditNote)
    {
        if ($creditNote->customer_id) {
            // Tạo công nợ khách hàng (ghi có - giảm công nợ phải thu)
            $this->customerDebtService->createDebtForCreditNote($creditNote);
        }

        if ($creditNote->supplier_id) {
            // Tạo công nợ nhà cung cấp (ghi có - giảm công nợ phải trả)
            $this->supplierDebtService->createDebtForCreditNote($creditNote);
        }

        $this->journalEntryService->confirmJournalByReference('credit_note', $creditNote->id);
    }

    /**
     * Xử lý khi hủy giấy báo có
     */
    private function handleCancel($creditNote)
    {
        if ($creditNote->customer_id) {
            $this->customerDebtService->deleteDebtByReference('credit_note', $creditNote->id);
        }
        if ($creditNote->supplier_id) {
            $this->supplierDebtService->deleteDebtByReference('credit_note', $creditNote->id);
        }

        $this->journalEntryService->deleteJournalByReference('credit_note', $creditNote->id);
    }

    /**
     * Chuẩn bị dữ liệu journal entries từ request
     */
    private function prepareJournalData($journalEntries)
    {
        if (isset($journalEntries['entries']) && is_array($journalEntries['entries'])) {
            return $journalEntries;
        }

        if (is_array($journalEntries) && !isset($journalEntries['entries'])) {
            return [
                'entries' => $journalEntries,
                'note' => request()->input('journal_note') ?? 'Bút toán từ giấy báo có',
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

        $cleaned = preg_replace('/[^\d]/', '', $amount);
        return (float) $cleaned;
    }

    /**
     * Lấy chi tiết giấy báo có
     */
    public function getCreditNoteDetail($id)
    {
        $creditNote = $this->creditNoteRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            [
                'customer',
                'supplier',
                'creator',
                'reference',
                'journalEntries' => function ($query) {
                    $query->with(['details.account.languages']);
                },
                'customerDebts',
                'supplierDebts'
            ]
        );

        if (!$creditNote) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Format Customer
        |--------------------------------------------------------------------------
        */
        if ($creditNote->customer_id) {
            $creditNote->party_info = [
                'id'   => $creditNote->customer?->id,
                'name' => $creditNote->customer?->name,
                'phone' => $creditNote->customer?->phone,
                'email' => $creditNote->customer?->email,
                'type' => 'customer'
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Format Supplier
        |--------------------------------------------------------------------------
        */
        if ($creditNote->supplier_id) {
            $creditNote->party_info = [
                'id'   => $creditNote->supplier?->id,
                'name' => $creditNote->supplier?->name,
                'phone' => $creditNote->supplier?->phone,
                'email' => $creditNote->supplier?->email,
                'type' => 'supplier'
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Format Journal Entries
        |--------------------------------------------------------------------------
        */
        $creditNote->journal_entries = $creditNote->journalEntries->isNotEmpty()
            ? $creditNote->journalEntries->map(function ($journal) {
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
        | Format Debt
        |--------------------------------------------------------------------------
        */
        $totalDebit = 0;
        $totalCredit = 0;
        $debts = $creditNote->customer_id ? $creditNote->customerDebts : $creditNote->supplierDebts;

        if ($debts && $debts->isNotEmpty()) {
            foreach ($debts as $debt) {
                $totalDebit += $debt->debit ?? 0;
                $totalCredit += $debt->credit ?? 0;
            }
        }

        $creditNote->debt = [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'balance'      => $totalDebit - $totalCredit,
            'details'      => $debts && $debts->isNotEmpty()
                ? $debts->map(function ($debt) {
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
        $creditNote->summary = [
            'type_name' => $this->getTypeName($creditNote->type),
            'status_name' => $this->getStatusName($creditNote->status),
            'created_by_name' => $creditNote->creator?->name,
        ];

        /*
        |--------------------------------------------------------------------------
        | Cleanup
        |--------------------------------------------------------------------------
        */
        unset($creditNote->journalEntries);
        unset($creditNote->customerDebts);
        unset($creditNote->supplierDebts);
        unset($creditNote->customer);
        unset($creditNote->supplier);
        unset($creditNote->creator);

        return $creditNote;
    }

    /**
     * Lấy tên loại báo có
     */
    private function getTypeName($type)
    {
        $types = [
            'sales_return' => 'Hàng trả lại',
            'discount' => 'Chiết khấu thanh toán',
            'price_adjustment' => 'Điều chỉnh giá giảm',
            'refund' => 'Hoàn tiền',
            'prepayment' => 'Ứng trước',
            'other' => 'Khác',
        ];

        return $types[$type] ?? $type;
    }

    /**
     * Lấy tên trạng thái
     */
    private function getStatusName($status)
    {
        $statuses = [
            'draft' => 'Nháp',
            'confirmed' => 'Đã xác nhận',
            'cancelled' => 'Đã hủy',
        ];

        return $statuses[$status] ?? $status;
    }

    /**
     * Tự động generate mã giấy báo có duy nhất
     */
    private function generateCreditNoteCode()
    {
        do {
            $code = 'BC_' . now()->format('Ymd_His');
            $exists = $this->creditNoteRepository->findByCondition(
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

    private function paginateSelect()
    {
        return [
            'credit_notes.id',
            'credit_notes.code',
            'credit_notes.issue_date',
            'credit_notes.customer_id',
            'credit_notes.supplier_id',
            DB::raw("CASE 
                WHEN credit_notes.customer_id IS NOT NULL THEN customers.name 
                ELSE suppliers.name 
            END as party_name"),
            'credit_notes.amount',
            'credit_notes.vat_rate',
            'credit_notes.vat_amount',
            'credit_notes.total_amount',
            'credit_notes.type',
            'credit_notes.reason',
            'credit_notes.status',
            'credit_notes.created_by',
        ];
    }

    private function payload()
    {
        return [
            'code',
            'issue_date',
            'customer_id',
            'supplier_id',
            'amount',
            'vat_rate',
            'vat_amount',
            'total_amount',
            'reason',
            'note',
            'type',
            'reference_type',
            'reference_id',
            'status',
        ];
    }
}