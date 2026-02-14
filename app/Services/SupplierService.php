<?php

namespace App\Services;

use App\Services\Interfaces\SupplierServiceInterface;
use App\Services\BaseService;
use App\Repositories\SupplierRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SupplierService extends BaseService implements SupplierServiceInterface
{
    protected $supplierRepository;

    public function __construct(SupplierRepository $supplierRepository)
    {
        $this->supplierRepository = $supplierRepository;
    }

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
            'path' => '/supplier/index',
            'fieldSearch' => ['supplier_code', 'name'],
        ];

        return $this->supplierRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC']
        );
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {

            $payload = $request->only($this->payload());
            $payload['user_id'] = Auth::id();

            // 🔥 TỰ ĐỘNG TẠO MÃ
            $payload['supplier_code'] = $this->generateSupplierCode();

            $supplier = $this->supplierRepository->create($payload);

            $this->syncBankAccounts(
                $supplier,
                $request->input('bank_accounts', [])
            );

            return $supplier;
        });
    }

    public function update($request, $id)
    {
        return DB::transaction(function () use ($id, $request) {

            $payload = $request->only($this->payload());
            $payload['user_id'] = Auth::id();

            $updated = $this->supplierRepository->update(
                $id,
                $payload,
            );

            if (!$updated) {
                throw new \Exception('Cập nhật nhà cung cấp thất bại.');
            }

            $supplier = $this->supplierRepository->findById($id);

            $this->syncBankAccounts(
                $supplier,
                $request->input('bank_accounts', [])
            );

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $supplier = $this->supplierRepository->findById($id);

            if (!$supplier) {
                throw new \Exception('Nhà cung cấp không tồn tại.');
            }

            $supplier->delete();

            return true;
        });
    }

    private function generateSupplierCode()
    {
        $latest = $this->supplierRepository->findLastest();

        if (!$latest) {
            return 'SUP_001';
        }

        $latestCode = $latest->supplier_code; // ví dụ BANK_0012
        preg_match('/(\d+)/', $latestCode, $matches);

        $number = isset($matches[1]) ? (int)$matches[1] + 1 : 1;

        return 'SUP_' . str_pad($number, 3, '0', STR_PAD_LEFT);
    }

    private function syncBankAccounts($supplier, $banks)
    {
        if (empty($banks)) {
            $supplier->banks()->detach();
            return;
        }

        $syncData = [];

        foreach ($banks as $bank) {
            $syncData[$bank['bank_code']] = [
                'account_number' => $bank['account_number'],
            ];
        }

        $supplier->banks()->sync($syncData);
    }

    public function getSupplier($id)
    {
        $supplier = $this->supplierRepository->findByCondition([
            ['id', '=', $id]
        ]);

        $supplier->bank_accounts = $supplier->banks->map(function ($bank) {
            return [
                'bank_code'        => $bank->bank_code,
                'account_number' => $bank->pivot->account_number,
            ];
        });

        return $supplier;
    }

    public function getSupplierList()
    {
        return $this->supplierRepository->findByCondition([
            ['publish', '=', 1]
        ], true, [], [], ['id', 'name']);;
    }

    private function paginateSelect()
    {
        return [
            'id',
            'name',
            'tax_code',
            'avatar',
            'phone',
            'email',
            'description',
            'address',
            'fax',
            'user_id',
            'publish',
        ];
    }
    private function payload()
    {
        return [
            'supplier_code',
            'name',
            'tax_code',
            'province_id',
            'ward_id',
            'avatar',
            'phone',
            'email',
            'description',
            'address',
            'fax',
            'user_id',
            'publish',
        ];
    }
}
