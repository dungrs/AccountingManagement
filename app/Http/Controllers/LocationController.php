<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Repositories\Location\ProvinceRepository;
use App\Repositories\Location\WardRepository;

class LocationController
{
    protected $provinceRepository;
    protected $wardRepository;

    public function __construct(
        ProvinceRepository $provinceRepository,
        WardRepository $wardRepository
    ) {
        $this->provinceRepository = $provinceRepository;
        $this->wardRepository = $wardRepository;
    }

    public function getLocation(Request $request)
    {
        $payload = $request->input('params', []);
        $data = [];

        if (($payload['target'] ?? null) === 'wards') {
            $provinceId = (int) ($payload['data']['location_id'] ?? 0);

            if ($provinceId > 0) {
                $province = $this->provinceRepository->findById(
                    $provinceId,
                    ['id', 'province_code']
                );

                if ($province) {
                    // 2️⃣ Lấy wards theo province_code
                    $wards = $this->wardRepository->findByCondition(
                        [
                            ['province_code', '=', $province->province_code],
                        ],
                        true, // lấy nhiều record
                        [],
                        ['name' => 'ASC'],
                        ['ward_code', 'name']
                    );

                    // 3️⃣ Format cho FE
                    $data = $wards->map(function ($ward) {
                        return [
                            'value' => $ward->ward_code,
                            'label' => $ward->name,
                        ];
                    })->toArray();
                }
            }
        }

        return response()->json(['data' => $data]);
    }
}
