<?php

namespace App\Repositories\Product;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductVariantRepositoryInterface;
use App\Models\ProductVariant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProductVariantRepository extends BaseRepository implements ProductVariantRepositoryInterface
{
    protected $model;

    public function __construct(ProductVariant $model)
    {
        $this->model = $model;
    }

    /**
     * Lấy tổng giá trị tồn kho
     */
    public function getTotalInventoryValue(): float
    {
        return (float) $this->model->sum(DB::raw('quantity * base_price'));
    }

    /**
     * Lấy tổng số lượng sản phẩm tồn kho
     */
    public function getTotalInventoryItems(): float
    {
        return (float) $this->model->sum('quantity');
    }

    /**
     * Lấy danh sách sản phẩm sắp hết hàng (tồn < threshold)
     */
    public function getLowStockProducts(int $threshold = 10, int $limit = 5, int $languageId = 1): array
    {
        $lowStock = $this->model
            ->leftJoin('product_variant_languages as pvl', function ($join) use ($languageId) {
                $join->on('pvl.product_variant_id', 'product_variants.id')
                    ->where('pvl.language_id', $languageId);
            })
            ->where('product_variants.quantity', '<', $threshold)
            ->where('product_variants.quantity', '>', 0)
            ->select(
                'product_variants.id',
                'pvl.name as product_name',
                'product_variants.quantity'
            )
            ->orderBy('product_variants.quantity', 'ASC')
            ->limit($limit)
            ->get();

        return $lowStock->toArray();
    }

    /**
     * Đếm số sản phẩm hết hàng
     */
    public function countOutOfStockProducts(): int
    {
        return $this->model->where('quantity', '<=', 0)->count();
    }

    /**
     * Lấy thông tin tồn kho tổng hợp
     */
    public function getInventorySummary(): array
    {
        return [
            'total_value' => $this->getTotalInventoryValue(),
            'total_items' => $this->getTotalInventoryItems(),
            'low_stock' => $this->getLowStockProducts(),
            'out_of_stock' => $this->countOutOfStockProducts(),
        ];
    }

    public function getProductVariant($languageId)
    {
        return $this->model
            ->select([
                'product_variants.id as product_variant_id',
                DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name")
            ])
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('product_languages', function ($join) use ($languageId) {
                $join->on('product_languages.product_id', '=', 'products.id')
                    ->where('product_languages.language_id', '=', $languageId);
            })
            ->join('product_variant_languages', function ($join) use ($languageId) {
                $join->on('product_variant_languages.product_variant_id', '=', 'product_variants.id')
                    ->where('product_variant_languages.language_id', '=', $languageId);
            })
            ->get();
    }

    /**
     * Lấy chi tiết theo mặt hàng
     */
    public function getProductDetails(Carbon $startDate, Carbon $endDate)
    {
        return $this->model
            ->join('sales_receipt_items as sri', 'sri.product_variant_id', '=', 'product_variants.id')
            ->join('sales_receipts as sr', 'sr.id', '=', 'sri.sales_receipt_id')
            ->leftJoin('product_variant_languages as pvl', function ($join) {
                $join->on('pvl.product_variant_id', 'product_variants.id')
                    ->where('pvl.language_id', 1);
            })
            ->leftJoin('units as u', 'u.id', '=', 'product_variants.unit_id')
            ->whereBetween('sr.receipt_date', [$startDate, $endDate])
            ->where('sr.status', 'confirmed')
            ->select(
                'product_variants.id as product_variant_id',
                'pvl.name as product_name',
                'u.name as unit_name',
                DB::raw('SUM(sri.quantity) as total_quantity'),
                DB::raw('AVG(sri.price) as avg_price'),
                DB::raw('SUM(sri.quantity * sri.price) as revenue'),
                DB::raw('SUM(sri.discount_amount) as discount'),
                DB::raw('SUM(sri.vat_amount) as vat')
            )
            ->groupBy('product_variants.id', 'pvl.name', 'u.name')
            ->orderBy('revenue', 'DESC')
            ->get();
    }

    /**
     * Đếm tổng số sản phẩm đang hoạt động
     */
    public function countActiveProducts(): int
    {
        return $this->model->where('publish', 1)->count();
    }
}