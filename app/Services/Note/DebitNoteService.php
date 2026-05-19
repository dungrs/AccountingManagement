<?php

namespace App\Services\Note;

use App\Services\Interfaces\Note\DebitNoteServiceInterface;
use App\Services\BaseService;
use App\Repositories\Note\DebitNoteRepository;
use App\Services\JournalEntryService;
use App\Services\Debt\CustomerDebtService;
use App\Services\Debt\SupplierDebtService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DebitNoteService extends BaseService implements DebitNoteServiceInterface
{
    protected $debitNoteRepository;
    protected $journalEntryService;
    protected $customerDebtService;
    protected $supplierDebtService;

    public function __construct(
        DebitNoteRepository $debitNoteRepository,
        JournalEntryService $journalEntryService,
        CustomerDebtService $customerDebtService,
        SupplierDebtService $supplierDebtService
    ) {
        $this->debitNoteRepository = $debitNoteRepository;
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
        $partyType = $request->input('party_type'); // customer hoặc supplier

        $where = [];

        if (!empty($status) && $status !== 'all') {
            $where[] = ['debit_notes.status', '=', $status];
        }

        if (!empty($type) && $type !== 'all') {
            $where[] = ['debit_notes.type', '=', $type];
        }

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'where' => $where
        ];

        $extend = [
            'path' => '/note/debit/index',
            'fieldSearch' => [
                'debit_notes.code',
                'debit_notes.reason',
                'debit_notes.note',
                'customers.name',
                'suppliers.name',
            ],
        ];

        $joins = [];

        if ($partyType === 'customer') {
            $joins[] = [
                'table' => 'customers',
                'on' => [
                    ['customers.id', 'debit_notes.customer_id'],
                ],
            ];
        } elseif ($partyType === 'supplier') {
            $joins[] = [
                'table' => 'suppliers',
                'on' => [
                    ['suppliers.id', 'debit_notes.supplier_id'],
                ],
            ];
        } else {
            $joins = [
                [
                    'table' => 'customers',
                    'on' => [
                        ['customers.id', 'debit_notes.customer_id'],
                    ],
                    'type' => 'left'
                ],
                [
                    'table' => 'suppliers',
                    'on' => [
                        ['suppliers.id', 'debit_notes.supplier_id'],
                    ],
                    'type' => 'left'
                ],
            ];
        }

        return $this->debitNoteRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['debit_notes.id', 'DESC'],
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
                $payload['code'] = $this->generateDebitNoteCode();
            }

            $debitNote = $this->debitNoteRepository->create($payload);

            // Tạo journal entries
            if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                $journalData = $this->prepareJournalData($request->input('journal_entries'));

                $this->journalEntryService->createFromRequest(
                    'debit_note',
                    $debitNote->id,
                    $journalData,
                    $debitNote->issue_date
                );
            }

            // Xử lý khi xác nhận
            if ($payload['status'] === 'confirmed') {
                $this->handleConfirm($debitNote);
            }

            return $debitNote;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $debitNote = $this->debitNoteRepository->findByCondition(
                [['id', '=', $id]],
                false,
                [],
                [],
                ['*'],
                ['journalEntries']
            );

            if (!$debitNote) {
                throw new \Exception('Giấy báo nợ không tồn tại.');
            }

            if ($debitNote->status === 'cancelled') {
                throw new \Exception('Giấy báo nợ đã hủy không thể chỉnh sửa.');
            }

            $newStatus = $request->input('status');

            /*
            |--------------------------------------------------------------------------
            | Nếu đang CONFIRMED
            |--------------------------------------------------------------------------
            */
            if ($debitNote->status === 'confirmed') {

                // Chỉ cho phép hủy
                if ($newStatus === 'cancelled') {
                    $this->handleCancel($debitNote);
                    $debitNote->update(['status' => 'cancelled']);
                    return true;
                }

                throw new \Exception('Giấy báo nợ đã xác nhận không thể chỉnh sửa.');
            }

            /*
            |--------------------------------------------------------------------------
            | Nếu đang DRAFT
            |--------------------------------------------------------------------------
            */
            if ($debitNote->status === 'draft') {
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

                // Không cho phép sửa code khi update
                unset($payload['code']);

                $this->debitNoteRepository->update($id, $payload);

                // Cập nhật journal entries
                if ($request->has('journal_entries') && !empty($request->input('journal_entries'))) {
                    $journalData = $this->prepareJournalData($request->input('journal_entries'));

                    $this->journalEntryService->updateJournalByReference(
                        'debit_note',
                        $debitNote->id,
                        $journalData,
                        $debitNote->issue_date
                    );
                } else {
                    // Nếu không có journal entries, xóa định khoản cũ
                    $this->journalEntryService->deleteJournalByReference('debit_note', $debitNote->id);
                }

                // Nếu từ draft → confirmed
                if ($newStatus === 'confirmed') {
                    $debitNote = $this->debitNoteRepository->findById($id);
                    $this->handleConfirm($debitNote);
                }

                return true;
            }

            return false;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $debitNote = $this->debitNoteRepository->findById($id);

            if (!$debitNote) {
                throw new \Exception('Giấy báo nợ không tồn tại.');
            }

            // Xóa journal entries
            $this->journalEntryService->deleteJournalByReference('debit_note', $debitNote->id);

            // Xóa công nợ nếu đã confirmed
            if ($debitNote->status === 'confirmed') {
                if ($debitNote->customer_id) {
                    $this->customerDebtService->deleteDebtByReference('debit_note', $debitNote->id);
                }
                if ($debitNote->supplier_id) {
                    $this->supplierDebtService->deleteDebtByReference('debit_note', $debitNote->id);
                }
            }

            $debitNote->delete();

            return true;
        });
    }

    /**
     * Xử lý khi xác nhận giấy báo nợ
     */
    private function handleConfirm($debitNote)
    {
        if ($debitNote->customer_id) {
            // Tạo công nợ khách hàng (ghi nợ - tăng công nợ phải thu)
            $this->customerDebtService->createDebtForDebitNote($debitNote);
        }

        if ($debitNote->supplier_id) {
            // Tạo công nợ nhà cung cấp (ghi nợ - tăng công nợ phải trả)
            $this->supplierDebtService->createDebtForDebitNote($debitNote);
        }

        // Xác nhận journal entries
        $this->journalEntryService->confirmJournalByReference('debit_note', $debitNote->id);
    }

    /**
     * Xử lý khi hủy giấy báo nợ
     */
    private function handleCancel($debitNote)
    {
        // Xóa công nợ
        if ($debitNote->customer_id) {
            $this->customerDebtService->deleteDebtByReference('debit_note', $debitNote->id);
        }
        if ($debitNote->supplier_id) {
            $this->supplierDebtService->deleteDebtByReference('debit_note', $debitNote->id);
        }

        // Xóa định khoản
        $this->journalEntryService->deleteJournalByReference('debit_note', $debitNote->id);
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
                'note' => request()->input('journal_note') ?? 'Bút toán từ giấy báo nợ',
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
     * Lấy chi tiết giấy báo nợ
     */
    public function getDebitNoteDetail($id)
    {
        $debitNote = $this->debitNoteRepository->findByCondition(
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

        if (!$debitNote) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Format Customer
        |--------------------------------------------------------------------------
        */
        if ($debitNote->customer_id) {
            $debitNote->party_info = [
                'id'   => $debitNote->customer?->id,
                'name' => $debitNote->customer?->name,
                'phone' => $debitNote->customer?->phone,
                'email' => $debitNote->customer?->email,
                'type' => 'customer'
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Format Supplier
        |--------------------------------------------------------------------------
        */
        if ($debitNote->supplier_id) {
            $debitNote->party_info = [
                'id'   => $debitNote->supplier?->id,
                'name' => $debitNote->supplier?->name,
                'phone' => $debitNote->supplier?->phone,
                'email' => $debitNote->supplier?->email,
                'type' => 'supplier'
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Format Journal Entries
        |--------------------------------------------------------------------------
        */
        $debitNote->journal_entries = $debitNote->journalEntries->isNotEmpty()
            ? $debitNote->journalEntries->map(function ($journal) {
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
        $debts = $debitNote->customer_id ? $debitNote->customerDebts : $debitNote->supplierDebts;

        if ($debts && $debts->isNotEmpty()) {
            foreach ($debts as $debt) {
                $totalDebit += $debt->debit ?? 0;
                $totalCredit += $debt->credit ?? 0;
            }
        }

        $debitNote->debt = [
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
        $debitNote->summary = [
            'type_name' => $this->getTypeName($debitNote->type),
            'status_name' => $this->getStatusName($debitNote->status),
            'created_by_name' => $debitNote->creator?->name,
        ];

        /*
        |--------------------------------------------------------------------------
        | Cleanup
        |--------------------------------------------------------------------------
        */
        unset($debitNote->journalEntries);
        unset($debitNote->customerDebts);
        unset($debitNote->supplierDebts);
        unset($debitNote->customer);
        unset($debitNote->supplier);
        unset($debitNote->creator);

        return $debitNote;
    }

    /**
     * Lấy tên loại báo nợ
     */
    private function getTypeName($type)
    {
        $types = [
            'sales_return' => 'Hàng bán trả lại',
            'discount_after' => 'Chiết khấu thương mại',
            'price_adjustment' => 'Điều chỉnh giá',
            'penalty' => 'Phạt hợp đồng',
            'interest' => 'Lãi quá hạn',
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
     * Tự động generate mã giấy báo nợ duy nhất
     */
    private function generateDebitNoteCode()
    {
        do {
            $code = 'BN_' . now()->format('Ymd_His');
            $exists = $this->debitNoteRepository->findByCondition(
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
            'debit_notes.id',
            'debit_notes.code',
            'debit_notes.issue_date',
            'debit_notes.customer_id',
            'debit_notes.supplier_id',
            DB::raw("CASE 
                WHEN debit_notes.customer_id IS NOT NULL THEN customers.name 
                ELSE suppliers.name 
            END as party_name"),
            'debit_notes.amount',
            'debit_notes.vat_rate',
            'debit_notes.vat_amount',
            'debit_notes.total_amount',
            'debit_notes.type',
            'debit_notes.reason',
            'debit_notes.status',
            'debit_notes.created_by',
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