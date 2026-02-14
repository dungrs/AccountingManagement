<?php

namespace App\Repositories\Journal;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Journal\JournalEntryRepositoryInterface;
use App\Models\JournalEntry;

class JournalEntryRepository extends BaseRepository implements JournalEntryRepositoryInterface {
    protected $model;

    public function __construct(JournalEntry $model) {
        $this->model = $model;
    }
}
