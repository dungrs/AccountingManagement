<?php

namespace App\Repositories\Note;

use App\Repositories\BaseRepository;
use App\Models\CreditNote;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CreditNoteRepository extends BaseRepository
{
    protected $model;

    public function __construct(CreditNote $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy tổng số tiền báo có trong khoảng thời gian
     */
    public function getTotalCreditNoteAmount(Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('total_amount');
    }

    /**
     * Lấy tổng số tiền báo có theo khách hàng
     */
    public function getTotalCreditNoteByCustomer(int $customerId, Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->where('customer_id', $customerId)
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('total_amount');
    }

    /**
     * Lấy tổng số tiền báo có theo nhà cung cấp
     */
    public function getTotalCreditNoteBySupplier(int $supplierId, Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->where('supplier_id', $supplierId)
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('total_amount');
    }

    /**
     * Lấy thông tin credit note với các quan hệ
     */
    public function getCreditNoteWithRelations(int $id): ?CreditNote
    {
        return $this->model->with(['customer', 'supplier', 'creator'])->find($id);
    }

    /**
     * Lấy thông tin cơ bản của credit note (code, reason, note, issue_date)
     */
    public function getBasicInfo(int $id): array
    {
        $creditNote = $this->findById($id, ['code', 'reason', 'note', 'issue_date']);

        if (!$creditNote) {
            return [];
        }

        return [
            'code' => $creditNote->code,
            'reason' => $creditNote->reason,
            'note' => $creditNote->note,
            'issue_date' => $creditNote->issue_date,
        ];
    }

    /**
     * Lấy danh sách credit note theo điều kiện
     */
    public function getCreditNotesByCondition(array $condition = []): Collection
    {
        return $this->findByCondition($condition, true);
    }

    /**
     * Lấy danh sách credit note theo khách hàng
     */
    public function getCreditNotesByCustomer(int $customerId, array $condition = []): Collection
    {
        $condition = array_merge([['customer_id', '=', $customerId]], $condition);
        return $this->getCreditNotesByCondition($condition);
    }

    /**
     * Lấy danh sách credit note theo nhà cung cấp
     */
    public function getCreditNotesBySupplier(int $supplierId, array $condition = []): Collection
    {
        $condition = array_merge([['supplier_id', '=', $supplierId]], $condition);
        return $this->getCreditNotesByCondition($condition);
    }

    /**
     * Lấy danh sách credit note theo trạng thái
     */
    public function getCreditNotesByStatus(string $status): Collection
    {
        return $this->findByCondition([['status', '=', $status]], true);
    }

    /**
     * Lấy danh sách credit note theo loại
     */
    public function getCreditNotesByType(string $type): Collection
    {
        return $this->findByCondition([['type', '=', $type]], true);
    }

    /**
     * Kiểm tra credit note có tồn tại không
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }

    /**
     * Cập nhật trạng thái credit note
     */
    public function updateStatus(int $id, string $status): bool
    {
        return $this->update($id, ['status' => $status]);
    }

    /**
     * Đếm số lượng credit note theo khách hàng
     */
    public function countCreditNotesByCustomer(int $customerId): int
    {
        return $this->model->where('customer_id', $customerId)->count();
    }

    /**
     * Đếm số lượng credit note theo nhà cung cấp
     */
    public function countCreditNotesBySupplier(int $supplierId): int
    {
        return $this->model->where('supplier_id', $supplierId)->count();
    }
}