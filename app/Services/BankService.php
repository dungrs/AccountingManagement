<?php

namespace App\Services;

use App\Services\Interfaces\BankServiceInterface;
use App\Services\BaseService;
use App\Repositories\BankRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BankService extends BaseService implements BankServiceInterface
{
    protected $bankRepository;

    public function __construct(BankRepository $bankRepository)
    {
        $this->bankRepository = $bankRepository;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' => $publish,
        ];

        $extend['path'] = '/bank/index';
        $extend['fieldSearch'] = ['name', 'bank_code', 'short_name'];

        $banks = $this->bankRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['id', 'DESC'],
            [],
            []
        );

        return $banks;
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            return $this->createBank($request);
        });
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {

            $bankId = $request->input('id');

            $flag = $this->updateBank($request, $bankId);

            if (!$flag) {
                throw new \Exception("Cập nhật ngân hàng thất bại.");
            }

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $bank = $this->bankRepository->findById($id);

            if (!$bank) {
                throw new \Exception("Ngân hàng không tồn tại.");
            }

            $deleted = $this->bankRepository->delete($id);

            if (!$deleted) {
                throw new \Exception("Xóa ngân hàng thất bại.");
            }

            return true;
        });
    }

    public function getBankDetails($id)
    {
        return $this->bankRepository->findById($id);
    }

    /* ===================== PRIVATE ===================== */

    private function createBank($request)
    {
        $payload = $request->only($this->payload());

        // Auto generate bank_code dạng BANK_0001
        $payload['bank_code'] = $this->generateBankCode();

        // gán user_id
        $payload['user_id'] = Auth::id();

        return $this->bankRepository->create($payload);
    }

    private function updateBank($request, $id)
    {
        $payload = $request->only($this->payload());

        // không cho update bank_code/user_id
        unset($payload['bank_code']);
        unset($payload['user_id']);

        return $this->bankRepository->update($id, $payload);
    }

    private function generateBankCode()
    {
        $latestBank = $this->bankRepository->findLastest();

        if (!$latestBank) {
            return 'BANK_0001';
        }

        $latestCode = $latestBank->bank_code; // ví dụ BANK_0012
        preg_match('/(\d+)/', $latestCode, $matches);

        $number = isset($matches[1]) ? (int)$matches[1] + 1 : 1;

        return 'BANK_' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    private function payload()
    {
        return [
            'name',
            'short_name',
            'swift_code',
            'bin_code',
            'logo',
            'publish',
        ];
    }

    private function paginateSelect()
    {
        return [
            'id',
            'bank_code',
            'name',
            'short_name',
            'swift_code',
            'bin_code',
            'logo',
            'publish',
            'user_id',
        ];
    }
}
