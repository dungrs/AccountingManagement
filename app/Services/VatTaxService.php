<?php

namespace App\Services;

use App\Services\Interfaces\VatTaxServiceInterface;
use App\Services\BaseService;
use App\Repositories\VatTaxRepository;
use Illuminate\Support\Facades\DB;

class VatTaxService extends BaseService implements VatTaxServiceInterface
{
    protected $vatTaxRepository;

    public function __construct(VatTaxRepository $vatTaxRepository)
    {
        $this->vatTaxRepository = $vatTaxRepository;
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
            'path' => '/vattax/index',
            'fieldSearch' => ['code', 'name'],
        ];

        return $this->vatTaxRepository->paginate(
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

            // direction bắt buộc do user chọn
            if (empty($payload['direction'])) {
                throw new \Exception('Vui lòng chọn loại thuế (đầu vào / đầu ra).');
            }

            return $this->vatTaxRepository->create($payload);
        });
    }

    /* =======================
     |  UPDATE
     ======================= */

    public function update($request)
    {
        return DB::transaction(function () use ($request) {

            $vatTaxId = $request->input('id');
            $payload = $request->only($this->payload());

            $updated = $this->vatTaxRepository->update($vatTaxId, $payload);

            if (!$updated) {
                throw new \Exception('Cập nhật thuế VAT thất bại.');
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

            $vatTax = $this->vatTaxRepository->findById($id);

            if (!$vatTax) {
                throw new \Exception('Thuế VAT không tồn tại.');
            }

            if (!$this->vatTaxRepository->delete($id)) {
                throw new \Exception('Xóa thuế VAT thất bại.');
            }

            return true;
        });
    }

    /* =======================
     |  DETAIL
     ======================= */

    public function getVatTaxDetail($id)
    {
        return $this->vatTaxRepository->findById($id);
    }

    /* =======================
     |  PRIVATE
     ======================= */

    private function payload()
    {
        return [
            'code',
            'name',
            'rate',
            'direction',
            'description',
            'publish',
        ];
    }

    private function paginateSelect()
    {
        return [
            'id',
            'code',
            'name',
            'rate',
            'direction',
            'description',
            'publish',
        ];
    }
}