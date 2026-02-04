<?php

namespace App\Http\Controllers\Admin;

use App\Models\Group;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
        public function byUser(User $user) {
        $messages = Message::where('sender_id', Auth::id())
                        ->where('receiver_id', $user->id)
                        ->orWhere('sender_id', $user->id)
                        ->where('receiver_id', Auth::id())
                        ->latest()
                        ->paginate(10);

        return inertia("Home", [
            'selectedConversation' => $user->toConservationArray(),
            // 'messages' => MessageResource::collection($messages),
        ]);
    }

    public function byGroup(Group $group) {
        $messages = Message::where('group_id', $group->id)
                    ->latest()
                    ->paginate(10);

        return inertia("Home", [
            'selectedConversation' => $group->toConversationGroup(),
            // 'messages' => MessageResource::collection($messages),
        ]);
    }
}
