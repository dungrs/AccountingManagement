<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Group;
use App\Models\Message;
use App\Models\Conversation;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Tạo user cụ thể
        User::factory()->create([
            'name' => 'Thiều Lê Dũng',
            'email' => 'dunghung1209@example.com',
            'password' => bcrypt('password'),
            'user_catalogue_id' => '1',
            'is_admin' => true,
        ]);

        User::factory()->create([
            'name' => 'Phạm Thu Trang',
            'email' => 'thutrang1228@example.com',
            'user_catalogue_id' => '1',
            'password' => bcrypt('password'),
        ]);

        // Tạo thêm 10 user random
        User::factory(10)->create();

        // Tạo 5 nhóm
        for ($i = 0; $i < 5; $i++) {
            $group = Group::factory()->create([
                'owner_id' => 1,
            ]);

            // Lấy từ 2-5 user ngẫu nhiên + user 1
            $users = User::inRandomOrder()->limit(rand(2, 5))->pluck('id')->toArray();
            $group->users()->sync(array_unique(array_merge([1], $users)));
        }

        // Tạo 1000 tin nhắn (1-1 & group)
        Message::factory(1000)->create();

        // Tạo conversation cho các tin nhắn 1-1
        $messages = Message::whereNull('group_id')->orderBy('created_at')->get();

        $conversations = $messages->groupBy(function($message) {
            // Sắp xếp sender & receiver để cùng cặp user có cùng conversation
            return collect([$message->sender_id, $message->receiver_id])->sort()->implode('_');
        })->map(function($groupMessages) {
            return [
                'user_id1' => $groupMessages->first()->sender_id,
                'user_id2' => $groupMessages->first()->receiver_id,
                'last_message_id' => $groupMessages->last()->id,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->values();

        // Insert hoặc ignore để tránh duplicate
        Conversation::insertOrIgnore($conversations->toArray());
    }
}