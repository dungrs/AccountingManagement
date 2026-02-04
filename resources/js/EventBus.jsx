import React, { createContext, useContext, useRef } from "react";

// Tạo Context để chia sẻ EventBus cho toàn bộ component con
const EventBusContext = createContext();

export const EventBusProvider = ({ children }) => {
    // useRef lưu object events, key = tên event, value = mảng các callback
    // KHÔNG dùng state vì không cần re-render khi events thay đổi
    const events = useRef({});

    // emit: phát sự kiện
    const emit = (name, data) => {
        const handlers = events.current[name]; // lấy tất cả callback của event đó
        if (handlers) {
            handlers.forEach(cb => cb(data)); // gọi từng callback, truyền data
        }
    };

    // on: đăng ký lắng nghe một sự kiện
    const on = (name, cb) => {
        // nếu chưa có event name này thì tạo mảng rỗng
        if (!events.current[name]) {
            events.current[name] = [];
        }
        // thêm callback vào danh sách
        events.current[name].push(cb);

        // return một hàm để hủy đăng ký khi không cần lắng nghe nữa
        return () => {
            events.current[name] = events.current[name].filter(fn => fn !== cb);
        };
    };

    // cung cấp { emit, on } cho tất cả component con thông qua Context
    return (
        <EventBusContext.Provider value={{ emit, on }}>
            {children}
        </EventBusContext.Provider>
    );
};

// hook tiện lợi để dùng EventBus trong component
export const useEventBus = () => useContext(EventBusContext);