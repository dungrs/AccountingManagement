import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT, // 8080 khi dev
    wssPort: import.meta.env.VITE_REVERB_PORT, // 443 khi production
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https", // tự động theo env
    enabledTransports:
        import.meta.env.VITE_REVERB_SCHEME === "https" ? ["wss"] : ["ws"],
    disableStats: true,
    encrypted: false,
    auth: {
        headers: {
            "X-CSRF-TOKEN": document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content"),
        },
    },
});

export default echo;