<?php

namespace App\Services\Voucher;

use App\Services\Interfaces\Voucher\PaymentVoucherServiceInterface;
use App\Services\BaseService;
use App\Repositories\Voucher\PaymentVoucherRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentVoucherService extends BaseService implements PaymentVoucherServiceInterface
{
    protected $paymentVoucherRepository;

    public function __construct(PaymentVoucherRepository $paymentVoucherRepository)
    {
        $this->paymentVoucherRepository = $paymentVoucherRepository;
    }

    public function paginate($request)
    {
        $perpage = $request->integer('perpage') ?? 10;
        $page = $request->integer('page') ?? 1;


        $condition = [
            'keyword' => addslashes($request->input('keyword')),
        ];

        $extend = [
            'path' => '/price-list/index',
            'fieldSearch' => ['name', 'code'],
        ];

        return $this->paymentVoucherRepository->paginate(
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

            $paymentVoucher = $this->paymentVoucherRepository->create($payload);

            $this->syncPriceListItems(
                $paymentVoucher,
                $request->input('price_list_items', [])
            );

            return $paymentVoucher;
        });
    }


    public function update($request, $id)
    {
        return DB::transaction(function () use ($id, $request) {

            $payload = $request->only($this->payload());
            $payload['user_id'] = Auth::id();

            $updated = $this->paymentVoucherRepository->update($id, $payload);

            if (!$updated) {
                throw new \Exception('Cập nhật bảng giá thất bại.');
            }

            $paymentVoucher = $this->paymentVoucherRepository->findById($id);

            $this->syncPriceListItems(
                $paymentVoucher,
                $request->input('price_list_items', [])
            );

            return true;
        });
    }


    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $paymentVoucher = $this->paymentVoucherRepository->findById($id);

            if (!$paymentVoucher) {
                throw new \Exception('Nhà cung cấp không tồn tại.');
            }

            $paymentVoucher->delete();

            return true;
        });
    }

    private function syncPriceListItems($paymentVoucher, $items)
    {
        // Nếu không có item nào → xoá hết
        if (empty($items)) {
            $paymentVoucher->items()->delete();
            return;
        }

        // Xoá toàn bộ item cũ trước
        $paymentVoucher->items()->delete();

        $insertData = [];

        foreach ($items as $item) {
            $insertData[] = [
                'price_list_id'     => $paymentVoucher->id,
                'product_variant_id' => $item['product_variant_id'],
                'sale_price'        => $item['sale_price'],
                'output_tax_id'     => $item['output_tax_id'],
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        DB::table('price_list_items')->insert($insertData);
    }

    public function getPriceList($id)
    {
        $paymentVoucher = $this->paymentVoucherRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            ['items.productVariant'] // chỉ load tới productVariant
        );

        if (!$paymentVoucher) {
            return null;
        }

        $paymentVoucher->product_variants = $paymentVoucher->items->map(function ($item) {
            return [
                'product_variant_id' => $item->productVariant?->id,
                'barcode'               => $item->productVariant?->barcode,
                'name'               => $item->productVariant?->name,
                'sku'                => $item->productVariant?->sku,
                'sale_price'         => $item->sale_price,
                'output_tax_id'         => $item->output_tax_id,
            ];
        });

        unset($paymentVoucher->items);

        return $paymentVoucher;
    }

    private function paginateSelect()
    {
        return [
            'id',
            'name',
            'start_date',
            'end_date',
            'description',
            'user_id',
            'publish',
        ];
    }
    private function payload()
    {
        return [
            'name',
            'code',
            'description',
            'start_date',
            'end_date',
            'publish',
        ];
    }
}
