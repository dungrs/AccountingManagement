<?php

namespace App\Services\Product;

use App\Services\Interfaces\Product\ProductServiceInterface;
use App\Services\BaseService;
use App\Services\Product\ProductCatalogueService;
use App\Services\Product\ProductVariantService;
use App\Services\Attribute\AttributeService;
use App\Services\PromotionService;
use App\Repositories\Product\ProductRepository;
use App\Repositories\Product\ProductCatalogueRepository;
use App\Repositories\Product\ProductVariantAttributeRepository;
use App\Repositories\Product\ProductVariantLanguageRepository;
use App\Repositories\RouterRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Guid\Guid;

class ProductService extends BaseService implements ProductServiceInterface
{
    protected $productRepository;
    protected $productCatalogueRepository;
    protected $productVariantLanguageRepository;
    protected $productVariantAttributeRepository;
    protected $routerRepository;
    protected $productCatalogueService;
    protected $productVariantService;
    protected $promotionService;
    protected $attributeService;

    public function __construct(
        ProductRepository $productRepository,
        ProductCatalogueRepository $productCatalogueRepository,
        RouterRepository $routerRepository,
        ProductVariantLanguageRepository $productVariantLanguageRepository,
        ProductVariantAttributeRepository $productVariantAttributeRepository,
        ProductCatalogueService $productCatalogueService,
        ProductVariantService $productVariantService,
        // PromotionService $promotionService,
        AttributeService $attributeService,
    ) {
        $this->productRepository = $productRepository;
        $this->productCatalogueRepository = $productCatalogueRepository;
        $this->routerRepository = $routerRepository;
        $this->productVariantLanguageRepository = $productVariantLanguageRepository;
        $this->productVariantAttributeRepository = $productVariantAttributeRepository;
        $this->productCatalogueService = $productCatalogueService;
        $this->productVariantService = $productVariantService;
        // $this->promotionService = $promotionService;
        $this->attributeService = $attributeService;
    }

    public function paginate($request)
    {
        $perpage = $request->input('perpage') ?? 10;
        $page = $request->integer('page');
        $languageId = 1;
        $publish = $request->has('publish')
            ? (int) $request->input('publish')
            : null;

        $condition = [
            'keyword' => addslashes($request->input('keyword')),
            'publish' => $publish,
            'where' => [
                ['pl.language_id', '=', $languageId]
            ]
        ];

        $extend = [
            'path' => '/product/index',
            'fieldSearch' => ['pl.name'],
            'groupBy' => [
                'products.id',
                'products.product_catalogue_id',
                'products.publish',
                'products.image',
                'products.follow',
                'pl.name',
                'pl.canonical',
                'pl.language_id',
            ]
        ];

        $join = [
            [
                'table' => 'product_languages as pl',
                'on' => [['pl.product_id', 'products.id']]
            ],
            [
                'type' => 'left',
                'table' => 'product_variants as pv',
                'on' => [['pv.product_id', 'products.id']],
            ],
        ];

        return $this->productRepository->paginate(
            $this->paginateSelect(),
            $condition,
            $perpage,
            $page,
            $extend,
            ['products.id', 'DESC'],
            $join,
            ['languages', 'product_catalogues', 'product_variants'],
        );
    }

    public function loadVariant($request)
    {
        $get = $request->input();
        $attributeId = $get['attribute_id'];
        $attributeString = sortAttributeId($attributeId);

        $productVariant = $this->productVariantService->getProductVariant($get, $get['language_id'], $attributeString);
        $bestPromotion = $this->promotionService->getPromotionForProductVariant($get['product_id'], $productVariant);
        $productVariant->promotion = $bestPromotion;

        return $productVariant;
        // return response()->json([
        //     'status' => 'success',
        //     'data' => $productVariant,
        // ], 200);
    }

    public function create($request)
    {
        return DB::transaction(function () use ($request) {
            $product = $this->createProduct($request);

            if (!$product) {
                throw new \Exception("Tạo sản phẩm thất bại.");
            }

            $languageId = 1;
            $controllerName = $this->getControllerMappings();

            $this->updateLanguageForProduct($request, $product, $languageId);
            $this->uploadCatalogueForProduct($product, $request);
            $this->createRouter($request, $product, $controllerName, $languageId);

            $product->product_variants()->delete();
            $this->createVariant($product, $request, $languageId);
            $this->productCatalogueService->setAttribute($product, $languageId);

            return $product;
        });
    }

    public function update($request, $id, $languageId)
    {
        return DB::transaction(function () use ($request, $id, $languageId) {
            $product = $this->productRepository->findById($id);

            if (!$product) {
                throw new \Exception("Sản phẩm không tồn tại.");
            }

            $flag = $this->updateProduct($request, $id);

            if (!$flag) {
                throw new \Exception("Cập nhật sản phẩm thất bại.");
            }

            $controllerName = $this->getControllerMappings();

            $this->updateLanguageForProduct($request, $product, $languageId);
            $this->uploadCatalogueForProduct($product, $request);
            $this->updateRouter($request, $product, $controllerName, $languageId);

            $product->product_variants()->each(function ($variant) {
                $variant->languages()->detach();
                $variant->attributes()->detach();
                $variant->delete();
            });

            $this->createVariant($product, $request, $languageId);
            $this->productCatalogueService->setAttribute($product, $languageId);

            return true;
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $product = $this->productRepository->findById($id);

            if (!$product) {
                throw new \Exception("Sản phẩm không tồn tại.");
            }

            $this->productRepository->delete($id);

            $this->routerRepository->deleteByCondition([
                ['module_id', '=', $id],
                ['controllers', '=', 'App\Http\Controllers\Web\Product\ProductController']
            ]);

            return true;
        });
    }

    protected function baseProductQuery(array $conditions, bool $multiple = true, array $relations = [])
    {
        return $this->productRepository->findByCondition(
            $conditions,
            $multiple,
            [
                [
                    'table' => 'product_languages as pl',
                    'on' => [['pl.product_id', 'products.id']]
                ]
            ],
            ['products.id' => 'DESC'],
            [
                'products.*',
                'pl.name',
                'pl.description',
                'pl.content',
                'pl.meta_title',
                'pl.meta_keyword',
                'pl.meta_description',
                'pl.canonical',
                'pl.language_id',
            ],
            $relations
        );
    }

    public function getProductDetails($id, $languageId)
    {
        return $this->baseProductQuery([
            ['pl.language_id', '=', $languageId],
            ['products.id', '=', $id],
        ], false);
    }

    public function getProductOtherLanguages($id, $languageId)
    {
        return $this->baseProductQuery([
            ['pl.language_id', '!=', $languageId],
            ['products.id', '=', $id],
        ]);
    }

    public function getBestSellingProduct()
    {
        $condition = [
            ["product_languages.language_id", '=', 1],
            ["orders.confirm", '=', 'confirm'],
            ["orders.payment", '=', 'paid'],
        ];

        $join = [
            [
                'table' => "product_languages",
                'on' => [["product_languages.product_id", "products.id"]],
            ],
            [
                'table' => "order_products",
                'on' => [["order_products.product_id", "products.id"]],
            ],
            [
                'table' => "orders",
                'on' => [["orders.id", "order_products.order_id"]],
            ],
        ];

        $columns = [
            "products.id",
            "products.image",
            "products.album",
            "products.made_in",
            "products.created_at",
            "product_languages.name",
            "product_languages.description",
            "product_languages.canonical",
            "product_languages.meta_description",
            DB::raw("SUM(order_products.qty) as total_qty_sold")
        ];

        $relations = ['product_variants', 'orders'];

        $groupBy = [
            "products.id",
            "products.image",
            "products.album",
            "products.created_at",
            "products.made_in",
            "product_languages.name",
            "product_languages.description",
            "product_languages.canonical",
            "product_languages.meta_description"
        ];

        $orderBy = [
            'total_qty_sold' => 'DESC'
        ];

        $limit = 6;

        $products = $this->productRepository->findByCondition(
            $condition,
            true,
            $join,
            $orderBy,
            $columns,
            $relations,
            null,
            $groupBy,
            $limit
        );

        foreach ($products as $val) {
            $this->promotionService->applyPromotionToProduct($val, 'product');
        }

        return $products;
    }

    // FRONTEND SERVICE
    public function getRelatedProductsByCategory($productCatalogueId, $productId, $languageId)
    {
        $conditions = [
            ['pl.language_id', '=', $languageId],
            ['products.product_catalogue_id', '=', $productCatalogueId],
            ['products.id', '!=', $productId],
        ];

        $productRelateds = $this->baseProductQuery($conditions);

        foreach ($productRelateds as $product) {
            $this->promotionService->applyPromotionToProduct($product, 'product');
        }

        return $productRelateds;
    }

    private function createVariant($product, $request, $languageId)
    {
        $payload = $request->only(['variant', 'productVariant', 'attribute']);
        $variant = $this->createVariantArray($payload, $product);
        $createVariants = $product->product_variants()->createMany($variant);
        $variantId = $createVariants->pluck('id');

        $productVariantLanguages = [];
        $productVariantAttributes = [];
        $attributes = $this->combineAttributes(array_values($payload['attribute']));

        if (count($variantId)) {
            foreach ($variantId as $key => $val) {
                $productVariantLanguages[] = [
                    'product_variant_id' => $val,
                    'language_id' => $languageId,
                    'name' => $payload['productVariant']['name'][$key]
                ];

                if (count($attributes)) {
                    foreach ($attributes[$key] as $attributeId) {
                        $productVariantAttributes[] = [
                            'product_variant_id' => $val,
                            'attribute_id' => $attributeId,
                        ];
                    }
                }
            }
        }

        $this->productVariantAttributeRepository->createBatch($productVariantAttributes);
        $this->productVariantLanguageRepository->createBatch($productVariantLanguages);
    }

    private function createVariantArray($payload, $product)
    {
        $variant = [];

        if (isset($payload['variant']['sku']) && count($payload['variant']['sku'])) {
            foreach ($payload['variant']['sku'] as $key => $val) {
                $uuId = Guid::uuid5(Guid::NAMESPACE_DNS, sprintf('%s, %s', $product->id, $payload['productVariant']['id'][$key]));
                $vId = $payload['productVariant']['id'][$key] ?? '';
                $productVariantId = sortString($vId);

                $variant[] = [
                    'uuid' => $uuId,
                    'code' => $productVariantId,
                    'quantity' => isset($payload['variant']['quantity'][$key]) ? parseValue($payload['variant']['quantity'][$key]) : 0,
                    'sku' => $val,
                    'price' => isset($payload['variant']['price'][$key]) ? parseValue($payload['variant']['price'][$key]) : 0,
                    'barcode' => ($payload['variant']['barcode'][$key]) ?? '',
                    'file_name' => ($payload['variant']['file_name'][$key]) ?? '',
                    'file_url' => ($payload['variant']['file_url'][$key]) ?? '',
                    'album' => ($payload['variant']['album'][$key]) ?? '',
                    'user_id' => Auth::id(),
                ];
            }
        }

        return $variant;
    }

    private function combineAttributes($attributes = [], $index = 0)
    {
        if ($index === count($attributes)) return [[]];

        $subCombines = $this->combineAttributes($attributes, $index + 1);
        $combines = [];

        foreach ($attributes[$index] as $val) {
            foreach ($subCombines as $valSub) {
                $combines[] = array_merge([$val], $valSub);
            }
        }

        return $combines;
    }

    private function createProduct($request)
    {
        $payload = $request->only($this->payload());
        $payload['album'] = $this->formatJson($request, 'album');
        $payload['attributeCatalogue'] = $this->formatJson($request, 'attributeCatalogue');
        $payload['attribute'] = $this->formatJson($request, 'attribute');
        $payload['variant'] = $this->formatJson($request, 'variant');
        $payload['user_id'] = Auth::id();
        return $this->productRepository->create($payload);
    }

    private function updateProduct($request, $id)
    {
        $payload = $request->only($this->payload());
        $payload['album'] = $this->formatJson($request, 'album');
        $payload['attributeCatalogue'] = $this->formatJson($request, 'attributeCatalogue');
        $payload['attribute'] = $this->formatJson($request, 'attribute');
        $payload['variant'] = $this->formatJson($request, 'variant');
        $payload['user_id'] = Auth::id();
        return $this->productRepository->update($id, $payload);
    }

    private function updateLanguageForProduct($request, $product, $languageId)
    {
        $payload = $this->formatLanguagePayload($request, $product->id, $languageId);
        $product->languages()->detach($languageId, $product->id);
        return $this->productRepository->createPivot($product, $payload, 'languages');
    }

    private function uploadCatalogueForProduct($product, $request)
    {
        $product->product_catalogues()->sync($this->catalogue($request));
    }

    private function catalogue($request)
    {
        if ($request->input('catalogues') != null) {
            return array_unique(
                array_merge(
                    $request->input('catalogues'),
                    [$request->product_catalogue_id]
                )
            );
        }

        return [$request->product_catalogue_id];
    }

    private function payload()
    {
        return [
            'follow',
            'publish',
            'made_in',
            'image',
            'album',
            'product_catalogue_id',
            'attributeCatalogue',
            'attribute',
            'variant'
        ];
    }

    private function payloadLanguage()
    {
        return ['name', 'description', 'content', 'meta_title', 'meta_keyword', 'meta_description', 'canonical'];
    }

    private function formatLanguagePayload($request, $id, $languageId)
    {
        $payload = $request->only($this->payloadLanguage());
        $payload['product_id'] = $id;
        $payload['language_id'] = $languageId;
        return $payload;
    }

    private function getControllerMappings()
    {
        return [
            'parent' => 'Product',
            'child' => 'Product'
        ];
    }

    private function paginateSelect($isFrontend = false)
    {
        $select = [
            'products.id',
            'products.product_catalogue_id',
            'products.publish',
            'products.image',
            'products.follow',
            'pl.name',
            'pl.canonical',
            'pl.language_id',
            DB::raw('SUM(pv.quantity) as product_quantity'),
        ];

        if ($isFrontend) {
            $select[] = DB::raw('AVG(reviews.score) as average_rating');
        }

        return $select;
    }
}
