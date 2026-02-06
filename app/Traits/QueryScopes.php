<?php

namespace App\Traits;

trait QueryScopes
{

    public function scopeKeyword($query, $keyword, $fieldSearch = [], $whereHas = [])
    {
        if (!empty($keyword)) {
            if (count($fieldSearch) > 0) {
                foreach ($fieldSearch as $key => $val) {
                    $query->orWhere($val, 'LIKE', '%' . $keyword . '%');
                }
            } else {
                $query->where('name', 'LIKE', '%' . $keyword . '%');
            }
        }

        if (isset($whereHas) && count($whereHas)) {
            $field = $whereHas['field'];
            $query->orWhereHas($whereHas['relation'], function ($query) use ($field, $keyword) {
                $query->where($field, 'LIKE', '%' . $keyword . '%');
            });
        }
        return $query;
    }

    public function scopePublish($query, $publish)
    {
        if ($publish !== null) {
            $query->where('publish', (int) $publish);
        }

        return $query;
    }


    public function scopeCustomWhere($query, $where = [])
    {
        if (!empty($where)) {
            foreach ($where as $key => $val) {
                $query->where($val[0], $val[1], $val[2]);
            }
        }
        return $query;
    }

    public function scopeCustomWhereRaw($query, $rawQuery = [])
    {
        if (!empty($rawQuery) && is_array($rawQuery)) {
            foreach ($rawQuery as $item) {
                if (is_array($item)) {
                    $query->whereRaw($item[0], array_slice($item, 1));
                } else {
                    $query->whereRaw($item);
                }
            }
        }
        return $query;
    }

    public function scopeRelationCount($query, $relations)
    {
        if (!empty($relations)) {
            foreach ($relations as $item) {
                $query->withCount($item);
            }
        }
        return $query;
    }

    public function scopeRelation($query, $relations)
    {
        if (!empty($relations)) {
            foreach ($relations as $item) {
                $query->with($item);
            }
        }
        return $query;
    }

    public function scopeCustomJoin($query, $joins)
    {
        if (isset($joins) && is_array($joins) && count($joins)) {
            foreach ($joins as $join) {
                $type = isset($join['type']) ? strtolower($join['type']) : 'inner';
                $table = $join['table'];
                $onConditions = $join['on'];

                $query->join($table, function ($joinQuery) use ($onConditions, $type) {
                    foreach ($onConditions as $index => $condition) {
                        if ($index === 0) {
                            $joinQuery->on($condition[0], '=', $condition[1]);
                        } else {
                            $joinQuery->where($condition[0], '=', $condition[1]);
                        }
                    }
                }, null, null, $type);
            }
        }
        return $query;
    }
    public function scopeExtendCustomGroupBy($query, $groupBy = null)
    {
        if (!empty($groupBy)) {
            if (is_string($groupBy)) {
                $groupBy = preg_split('/\s*,\s*|\s+/', $groupBy);
            }

            $groupBy = is_array($groupBy) ? array_filter($groupBy) : [];

            if (!empty($groupBy)) {
                $processedGroupBy = array_map(function ($column) {
                    if (str_contains($column, '.') || str_contains(strtoupper($column), ' AS ')) {
                        return $column;
                    }
                }, $groupBy);
                $query->groupBy($processedGroupBy);
            }
        }

        return $query;
    }

    public function scopeExtendCustomOrderBy($query, $orderBy)
    {
        if (isset($orderBy) && !empty($orderBy)) {
            $query->orderBy($orderBy[0], $orderBy[1]);
        }
        return $query;
    }

    public function scopeCustomDropdownFilter($query, $condition)
    {
        if (count($condition) > 0) {
            foreach ($condition as $key => $val) {
                if ($val != 'none' && !empty($val) && $val != '') {
                    $query->where($key, '=', $val);
                }
            }
        }

        return $query;
    }

    public function scopeCustomWhereIn($query, $whereIn = [])
    {
        if (!empty($whereIn)) {
            foreach ($whereIn as $where) {
                $query->whereIn($where[0], $where[1]);
            }
        }
        return $query;
    }
}
