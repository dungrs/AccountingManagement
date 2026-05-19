<?php

namespace App\Repositories\Note;

use App\Repositories\BaseRepository;
use App\Models\DebitNote;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DebitNoteRepository extends BaseRepository
{
    protected $model;

    public function __construct(DebitNote $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy tổng số tiền báo nợ trong khoảng thời gian
     */
    public function getTotalDebitNoteAmount(Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('total_amount');
    }

    /**
     * Lấy tổng số tiền báo nợ theo khách hàng
     */
    public function getTotalDebitNoteByCustomer(int $customerId, Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->where('customer_id', $customerId)
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('total_amount');
    }

    /**
     * Lấy tổng số tiền báo nợ theo nhà cung cấp
     */
    public function getTotalDebitNoteBySupplier(int $supplierId, Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->where('supplier_id', $supplierId)
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('total_amount');
    }

    /**
     * Lấy thông tin debit note với các quan hệ
     */
    public function getDebitNoteWithRelations(int $id): ?DebitNote
    {
        return $this->model->with(['customer', 'supplier', 'creator'])->find($id);
    }

    /**
     * Lấy thông tin cơ bản của debit note (code, reason, note, issue_date)
     */
    public function getBasicInfo(int $id): array
    {
        $debitNote = $this->findById($id, ['code', 'reason', 'note', 'issue_date']);

        if (!$debitNote) {
            return [];
        }

        return [
            'code' => $debitNote->code,
            'reason' => $debitNote->reason,
            'note' => $debitNote->note,
            'issue_date' => $debitNote->issue_date,
        ];
    }

    /**
     * Lấy danh sách debit note theo điều kiện
     */
    public function getDebitNotesByCondition(array $condition = []): Collection
    {
        return $this->findByCondition($condition, true);
    }

    /**
     * Lấy danh sách debit note theo khách hàng
     */
    public function getDebitNotesByCustomer(int $customerId, array $condition = []): Collection
    {
        $condition = array_merge([['customer_id', '=', $customerId]], $condition);
        return $this->getDebitNotesByCondition($condition);
    }

    /**
     * Lấy danh sách debit note theo nhà cung cấp
     */
    public function getDebitNotesBySupplier(int $supplierId, array $condition = []): Collection
    {
        $condition = array_merge([['supplier_id', '=', $supplierId]], $condition);
        return $this->getDebitNotesByCondition($condition);
    }

    /**
     * Lấy danh sách debit note theo trạng thái
     */
    public function getDebitNotesByStatus(string $status): Collection
    {
        return $this->findByCondition([['status', '=', $status]], true);
    }

    /**
     * Lấy danh sách debit note theo loại
     */
    public function getDebitNotesByType(string $type): Collection
    {
        return $this->findByCondition([['type', '=', $type]], true);
    }

    /**
     * Kiểm tra debit note có tồn tại không
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }

    /**
     * Cập nhật trạng thái debit note
     */
    public function updateStatus(int $id, string $status): bool
    {
        return $this->update($id, ['status' => $status]);
    }

    /**
     * Đếm số lượng debit note theo khách hàng
     */
    public function countDebitNotesByCustomer(int $customerId): int
    {
        return $this->model->where('customer_id', $customerId)->count();
    }

    /**
     * Đếm số lượng debit note theo nhà cung cấp
     */
    public function countDebitNotesBySupplier(int $supplierId): int
    {
        return $this->model->where('supplier_id', $supplierId)->count();
    }
}