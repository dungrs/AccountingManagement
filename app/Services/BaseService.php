<?php

namespace App\Services;

use App\Services\Interfaces\BaseServiceInterface;

use App\Repositories\RouterRepository;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BaseService implements BaseServiceInterface
{
    // protected $routerRepository;

    // public function __construct(RouterRepository $routerRepository) {
    //     $this->routerRepository = $routerRepository;
    // }

    // public function createRouter($request, $model, $controllerName, $languageId) {
    //     $payloadRouter = $this->formatRouterPayload($request, $model, $controllerName, $languageId);
    //     $this->routerRepository->create($payloadRouter);
    // }

    // public function updateRouter($request, $model, $controllerName, $languageId) {
    //     $payloadRouter = $this->formatRouterPayload($request, $model, $controllerName, $languageId);
    //     $condition = [
    //         ['module_id', '=', $model->id],
    //         ['language_id', '=', $languageId],
    //         ['controllers', '=', "App\\Http\\Controllers\Frontend\\$controllerName[parent]\\$controllerName[child]Controller"]
    //     ];
    //     $router = $this->routerRepository->findByCondition($condition);
    //     $this->routerRepository->update($router->id, $payloadRouter);
    // }

    // public function formatRouterPayload($request, $model, $controllerName, $languageId) {
    //     return [
    //         'canonical' => Str::slug($request->input('canonical')),
    //         'module_id' => $model->id,
    //         'language_id' => $languageId,
    //         'controllers' =>  "App\\Http\\Controllers\Frontend\\$controllerName[parent]\\$controllerName[child]Controller",
    //     ];
    // }

    // public function formatJson($request, $inputName) {
    //     return ($request->input($inputName) && !empty($request->input($inputName))) ? json_encode($request->input($inputName)): '';
    // }

    // public function nestedSet()
    // {
    //     $this->nestedSet->Get();
    //     $this->nestedSet->Recursive(0, $this->nestedSet->Set());
    //     $this->nestedSet->Action();
    // }

    public function updateStatus(array $payload, int $id): bool
    {
        DB::beginTransaction();

        try {
            $dataUpdate = [
                $payload['field'] => $payload['status']
            ];

            $result = $this->{lcfirst($payload['model']) . 'Repository'}
                ->update($id, $dataUpdate);

            if (!$result) {
                DB::rollBack();
                return false;
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateStatusAll(array $payload): bool
    {
        DB::beginTransaction();

        try {
            $condition = [
                ['id', 'IN', $payload['ids']],
            ];

            $dataUpdate = [
                $payload['field'] => $payload['status']
            ];

            $result = $this->{lcfirst($payload['model']) . 'Repository'}
                ->updateByWhere($condition, $dataUpdate);

            if (!$result) {
                DB::rollBack();
                return false;
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // public function getItemsByParent($widget, $parentTable, $childTable, $language, $parentIds) {
    //     $items = resolveInstance($widget->model, $widget->modelParent, 'Repositories', 'Repository')->findByCondition(
    //         [
    //             ["{$childTable}s.publish", '=', 2],
    //             ["{$parentTable}_{$childTable}.{$parentTable}_id", '=', $parentIds],
    //             ["{$childTable}_languages.language_id", '=', $language],
    //         ],
    //         true,
    //         [
    //             [
    //                 'table' => "{$childTable}_languages",
    //                 'on' => [["{$childTable}_languages.{$childTable}_id", "{$childTable}s.id"]]
    //             ],
    //             [
    //                 'table' => "{$parentTable}_{$childTable}",
    //                 'on' => [["{$parentTable}_{$childTable}.{$childTable}_id", "{$childTable}s.id"]]
    //             ]
    //         ],
    //         ["{$childTable}s.id" => 'ASC'],
    //         [
    //             "{$childTable}s.id", 
    //             "{$childTable}_languages.canonical", 
    //             "{$childTable}s.image", 
    //             "{$childTable}_languages.name"
    //         ]
    //     );

    //     return $items;
    // }

    // public function breadcrumb($modelString, $modelParent, $model, $languageId) {
    //     $modelTable = Str::snake($modelString);
    //     return resolveInstance($modelString, $modelParent, 'Repositories', 'Repository')->findByCondition(
    //         [
    //             ['lft', '<=', $model->lft],
    //             ['rgt', '>=', $model->rgt],
    //             ["{$modelTable}_languages.language_id", "=", $languageId]
    //         ],
    //         true,
    //         [
    //             [
    //                 'table' => "{$modelTable}_languages",
    //                 "on" => [["{$modelTable}_languages.{$modelTable}_id", "{$modelTable}s.id"]]
    //             ]
    //         ]
    //     );
    // }
}
