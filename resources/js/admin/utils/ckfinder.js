import toast from "react-hot-toast";

export const CKFinderHelper = {
    open({ multiple = false, onSelect }) {
        if (!window.CKFinder) {
            toast.error("CKFinder chưa được load");
            return;
        }

        var finder = new window.CKFinder();
        finder.resourceType = 'Images';
        
        if (multiple) {
            // Chọn nhiều ảnh - giống code cũ với allFiles
            finder.selectActionFunction = function(fileUrl, data, allFiles) {
                var selectedFiles = [];
                
                // allFiles là array chứa tất cả files đã chọn
                if (allFiles && allFiles.length > 0) {
                    allFiles.forEach(function(file) {
                        selectedFiles.push(file.url);
                    });
                } else if (fileUrl) {
                    // Fallback nếu chỉ chọn 1 file
                    selectedFiles.push(fileUrl);
                }
                
                if (typeof onSelect === "function" && selectedFiles.length > 0) {
                    onSelect(selectedFiles);
                }
            };
        } else {
            // Chọn 1 ảnh
            finder.selectActionFunction = function(fileUrl) {
                if (typeof onSelect === "function") {
                    onSelect(fileUrl);
                }
            };
        }
        
        finder.popup();
    },
};