import axios from "axios";

export const changeStatusAll = async ({
    ids = [],
    field = "publish",
    status = 1,
    model = "",
    modelParent = "",
}) => {
    return axios.post(route("admin.changeStatusAll"), {
        ids,
        field,
        status,
        model,
        modelParent,
    });
};