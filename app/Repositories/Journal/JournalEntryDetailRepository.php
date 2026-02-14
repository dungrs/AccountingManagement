<?php

namespace App\Repositories\Journal;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Journal\JournalEntryDetailRepositoryInterface;
use App\Models\JournalEntryDetail;


class JournalEntryDetailRepository extends BaseRepository implements JournalEntryDetailRepositoryInterface {
    protected $model;

    public function __construct(JournalEntryDetail $model) {
        $this->model = $model;
    }
}