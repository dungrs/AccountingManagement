<?php

namespace App\Services;

use App\Services\Interfaces\UnitServiceInterface;
use App\Services\BaseService;
use App\Repositories\UnitRepository;
use Illuminate\Support\Facades\DB;

class UnitService extends BaseService implements UnitServiceInterface
{
    protected $unitRepository;

    public function __construct(UnitRepository $unitRepository)
    {
        $this->unitRepository = $unitRepository;
    }

    /* =======================
     |  LIST + PAGINATE
     ======================= */

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' => $publish,
        ];

        $extend = [
            'path' => '/unit/index',
            'fieldSearch' => ['code', 'name', 'description'],
        ];

        return $this->unitRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC']
        );
    }

    /* =======================
     |  CREATE
     ======================= */

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $payload = $request->only($this->payload());

            return $this->unitRepository->create($payload);
        });
    }

    /* =======================
     |  UPDATE
     ======================= */

    public function update($request)
    {
        return DB::transaction(function () use ($request) {

            $unitId = $request->input('id');
            $payload = $request->only($this->payload());

            $updated = $this->unitRepository->update($unitId, $payload);

            if (!$updated) {
                throw new \Exception('Cập nhật đơn vị tính thất bại.');
            }

            return true;
        });
    }

    /* =======================
     |  DELETE
     ======================= */

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $unit = $this->unitRepository->findById($id);

            if (!$unit) {
                throw new \Exception('Đơn vị tính không tồn tại.');
            }

            if (!$this->unitRepository->delete($id)) {
                throw new \Exception('Xóa đơn vị tính thất bại.');
            }

            return true;
        });
    }

    /* =======================
     |  DETAIL
     ======================= */

    public function getUnitDetail($id)
    {
        return $this->unitRepository->findById($id);
    }

    public function getUnitList()
    {
        return $this->unitRepository->findByCondition([
            ['publish', '=', 1]
        ], true, [], [], ['id', 'name']);
    }

    /* =======================
     |  PRIVATE
     ======================= */

    private function payload()
    {
        return [
            'code',
            'name',
            'description',
        ];
    }

    private function paginateSelect()
    {
        return [
            'id',
            'code',
            'name',
            'description',
            'publish',
        ];
    }
}
