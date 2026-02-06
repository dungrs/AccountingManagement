<?php

namespace App\Repositories\Interfaces;

interface BaseRepositoryInterface {
    public function all(array $relation = [], string $selectRaw = '');
    public function paginate(
        array $column = ['*'],
        array $condition = [],
        int $perpage = 1,
        int $page = 1,
        array $extend = [],
        array $orderBy = ['id', 'DESC'],
        array $join = [],
        array $relations = [],
        array $rawQuery = [],
    );
    public function create($payload = []);
    public function createPivot($model, array $payload, string $relation = '');
    public function createBatch(array $payload = []);
    public function findByCondition(
        $condition, 
        $flag = false, 
        array $joins = [], 
        array $orderBy = [], 
        array $select = ['*'], 
        array $relations = [],
        $paginate = null,
        array $groupBy = [],
        ?int $limit = null
    );
    public function findById(int $modelId, array $column = ['*'], array $relation = []);
    public function findByWhereHas(array $condition = [], string $relation = '', string $alias = '');
    public function updateByWhere(array $condition = [], array $payload = []);
    public function updateAndGetData(int $id = 0, array $payload = []);
    public function updateOrCreatePivot($model, $conditions, $attributes, $relation);
    public function updateOrCreate(array $attributes, array $values = []);
    public function updateOrInsert(array $condition = [], array $payload = []);
    public function update(int $id = 0, array $payload = []);
    public function delete(int $id = 0);
    public function deleteByCondition(array $conditions = [], bool $forceDelete = true);
    public function recursveCategory(string $parameter = '', $table = '');
    public function recursveCategoryGetParentAChild(string $parameter = '', $table = '');
}