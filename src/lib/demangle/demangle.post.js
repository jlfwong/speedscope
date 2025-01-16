/**
 * DO NOT USE THIS FILE DIRECTLY.
 *
 * This file is only used as --post-js of emcc.
 *
 * This file provides a higher level demangle function ready to use
 * in JavaScript.
 */
Module['wasm_demangle'] = function(mangled) {
    /*
     * We are manually calling the lower-level generated functions
     * instead of using `cwrap` because we need to `free` the pointer
     * returned by `_demangle`.
     */
    const param_ptr = stringToUTF8OnStack(mangled);
    const result_ptr = _demangle(param_ptr);
    const result = UTF8ToString(result_ptr);
    if (result_ptr !== null && result_ptr !== undefined) {
        _free(result_ptr);
    }
    return result;
}
