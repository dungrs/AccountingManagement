<?php

namespace App\Services;

use App\Services\Interfaces\PriceListServiceInterface;
use App\Services\BaseService;
use App\Repositories\Price\PriceListRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PriceListService extends BaseService implements PriceListServiceInterface
{
    protected $priceListRepository;

    public function __construct(PriceListRepository $priceListRepository)
    {
        $this->priceListRepository = $priceListRepository;
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
            'path' => '/price-list/index',
            'fieldSearch' => ['name', 'description'],
        ];

        return $this->priceListRepository->paginate(
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

            $priceList = $this->priceListRepository->create($payload);

            $this->syncPriceListItems(
                $priceList,
                $request->input('price_list_items', [])
            );

            return $priceList;
        });
    }


    public function update($request, $id)
    {
        return DB::transaction(function () use ($id, $request) {

            $payload = $request->only($this->payload());
            $payload['user_id'] = Auth::id();

            $updated = $this->priceListRepository->update($id, $payload);

            if (!$updated) {
                throw new \Exception('Cập nhật bảng giá thất bại.');
            }

            $priceList = $this->priceListRepository->findById($id);

            $this->syncPriceListItems(
                $priceList,
                $request->input('price_list_items', [])
            );

            return true;
        });
    }


    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $priceList = $this->priceListRepository->findById($id);

            if (!$priceList) {
                throw new \Exception('Nhà cung cấp không tồn tại.');
            }

            $priceList->delete();

            return true;
        });
    }

    private function syncPriceListItems($priceList, $items)
    {
        // Nếu không có item nào → xoá hết
        if (empty($items)) {
            $priceList->items()->delete();
            return;
        }

        // Xoá toàn bộ item cũ trước
        $priceList->items()->delete();

        $insertData = [];

        foreach ($items as $item) {
            $insertData[] = [
                'price_list_id'     => $priceList->id,
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
        $priceList = $this->priceListRepository->findByCondition(
            [['id', '=', $id]],
            false,
            [],
            [],
            ['*'],
            ['items.productVariant'] // chỉ load tới productVariant
        );

        if (!$priceList) {
            return null;
        }

        $priceList->product_variants = $priceList->items->map(function ($item) {
            return [
                'product_variant_id' => $item->productVariant?->id,
                'barcode'               => $item->productVariant?->barcode,
                'name'               => $item->productVariant?->name,
                'sku'                => $item->productVariant?->sku,
                'sale_price'         => $item->sale_price,
                'output_tax_id'         => $item->output_tax_id,
            ];
        });

        unset($priceList->items);

        return $priceList;
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
            'description',
            'start_date',
            'end_date',
            'publish',
        ];
    }
}
