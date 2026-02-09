<?php

namespace App\Http\Controllers\Backend\Product;

use App\Http\Controllers\BackendController;
use Illuminate\Http\Request;

use App\Services\Attribute\AttributeCatalogueService;
use App\Services\Product\ProductService;

use App\Classes\Nestedsetbie;

class ProductController extends BackendController
{   
    protected $productService;
    protected $attributeCatalogueService;
    protected $nestedSet;
    protected $languageId;

    public function __construct(ProductService $productService, AttributeCatalogueService $attributeCatalogueService) {
        $this->productService = $productService;
        $this->attributeCatalogueService = $attributeCatalogueService;
        $this->middleware(function($request, $next) {
            $this->languageId = session('currentLanguage')->id;
            $this->initialize();
            return $next($request);
        });
        $this->initialize();
    }

    public function index(Request $request) {
        $this->authorize('modules', 'product.index');
        $template = 'backend.product.product.index';
        $dropdown = $this->nestedSet->Dropdown();
        $configs = $this->configs();
        $configs['seo'] = __('messages.product');
        $configs['method'] = 'index';
        return view('backend.dashboard.layout', compact(
            'template',
            'configs',
            'dropdown'
        ));
    }

    public function create() {
        $this->authorize('modules', 'product.create');
        $template = 'backend.product.product.store';
        $dropdown = $this->nestedSet->Dropdown();
        $attributeCatalogues = $this->attributeCatalogueService->getAttributeCatalogueLanguages();
        $configs = $this->prepareConfigs('create');
        return view('backend.dashboard.layout', compact(
            'template', 
            'configs', 
            'dropdown',
            'attributeCatalogues'
        ));
    }

    public function edit($id, $languageId) {
        $this->authorize('modules', 'product.update');
        $template = 'backend.product.product.store';
        $this->languageId = $languageId;
        $this->initialize();
        $dropdown = $this->nestedSet->Dropdown();
        $attributeCatalogues = $this->attributeCatalogueService->getAttributeCatalogueLanguages($languageId);
        $product = $this->productService->getProductDetails($id, $languageId);
        $album = json_decode($product->album);
        $configs = $this->prepareConfigs('edit');
        return view('backend.dashboard.layout', compact(
            'template', 
            'configs', 
            'attributeCatalogues',
            'dropdown', 
            'product',
            'album'
        ));
    }
    
    public function configs() {
        return [
            'js' => [
                'backend/js/jquery-ui.js',
                'backend/js/library.js',
                'backend/js/pages/products.js',
            ],
            'css' => [
                'backend/libs/dropzone/min/dropzone.min.css'
            ],
            'model' => 'Product',
            'modelParent' => 'Product'
        ];
    }
    
    private function prepareConfigs($method) {
        $configs = $this->configs();
        $configs['seo'] = __('messages.product');
        $configs['method'] = $method;
        
        $additionalJs = [
            'backend/libs/%40ckeditor/ckeditor5-build-classic/build/ckeditor.js',
            'backend/libs/ckfinder/ckfinder.js',
            'backend/js/ckfinder.js',
            'backend/js/ckeditor.js',
            'backend/js/seo.js',
        ];

        $configs['js'] = array_merge($configs['js'], $additionalJs);
        
        return $configs;
    }

    private function initialize() {
        $this->nestedSet = new Nestedsetbie([
            'table' => 'product_catalogues',
            'foreignkey' => 'product_catalogue_id',
            'language_id' => $this->languageId,
        ]);
    }
}
