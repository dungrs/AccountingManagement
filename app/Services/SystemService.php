<?php

namespace App\Services;

use App\Services\Interfaces\SystemServiceInterface;
use App\Services\BaseService;
use App\Repositories\SystemRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SystemService extends BaseService implements SystemServiceInterface
{
    protected $systemRepository;
    protected $languageRepository;

    public function __construct(
        SystemRepository $systemRepository,
    ) {
        $this->systemRepository = $systemRepository;
    }

    /* =======================
     |  CREATE / UPDATE CONFIG
     ======================= */

    public function create($request)
    {
        return DB::transaction(function () use ($request) {

            $configs = $request->input('config', []);
            $languageId = 1; // Tạm thời lấy language_id = 1
            $userId = Auth::id();

            if (empty($languageId)) {
                throw new \Exception('Ngôn ngữ không hợp lệ.');
            }

            if (!is_array($configs) || empty($configs)) {
                throw new \Exception('Không có dữ liệu cấu hình.');
            }

            foreach ($configs as $key => $value) {

                $this->systemRepository->updateOrCreate(
                    [
                        'keyword' => $key,
                        'language_id' => $languageId,
                        'user_id' => $userId,
                    ],
                    [
                        'content' => $value,
                    ]
                );
            }

            return true;
        });
    }

    /* =======================
     |  DETAIL
     ======================= */

    public function getSystemDetails()
    {
        return $this->systemRepository->all();
    }
}