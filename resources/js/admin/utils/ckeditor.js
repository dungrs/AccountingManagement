export const CKEditorHelper = {
    init(selector = ".ckeditor-classic", options = {}) {
        if (!window.ClassicEditor) {
            console.warn("CKEditor chưa được load");
            return Promise.resolve([]);
        }

        const elements = document.querySelectorAll(selector);
        const promises = [];

        if (elements.length === 0) return Promise.resolve([]);

        elements.forEach((el) => {
            // Nếu đã có instance, skip
            if (el.ckEditorInstance) {
                promises.push(Promise.resolve(el.ckEditorInstance));
                return;
            }

            const promise = window.ClassicEditor.create(el, {
                ckfinder: {
                    uploadUrl: "",
                },
                ...options,
            })
                .then((editor) => {
                    editor.ui.view.editable.element.style.minHeight = "200px";
                    
                    // Lưu instance vào element
                    el.ckEditorInstance = editor;

                    // QUAN TRỌNG: Sync dữ liệu từ CKEditor về textarea
                    editor.model.document.on('change:data', () => {
                        const data = editor.getData();
                        el.value = data; // Update textarea value
                        
                        // Trigger event để React có thể bắt được
                        const event = new Event('input', { bubbles: true });
                        el.dispatchEvent(event);
                    });

                    // Set initial data nếu textarea có value
                    if (el.value) {
                        editor.setData(el.value);
                    }

                    return editor;
                })
                .catch((error) => {
                    console.error("CKEditor init error:", error);
                    return null;
                });

            promises.push(promise);
        });

        return Promise.all(promises);
    },

    getData(selector = ".ckeditor-classic") {
        const elements = document.querySelectorAll(selector);

        return Array.from(elements).map((el) =>
            el.ckEditorInstance ? el.ckEditorInstance.getData() : ""
        );
    },

    setData(selector, data) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((el) => {
            if (el.ckEditorInstance) {
                el.ckEditorInstance.setData(data || '');
            }
        });
    },

    destroy(selector = ".ckeditor-classic") {
        const elements = document.querySelectorAll(selector);

        elements.forEach((el) => {
            if (el.ckEditorInstance) {
                el.ckEditorInstance.destroy().catch(err => {
                    console.error("Error destroying CKEditor:", err);
                });
                el.ckEditorInstance = null;
            }
        });
    },
};