#include "gcc/include/demangle.h"

#include <string.h>

static char *non_microsoft_demangle(const char *mangled) {
  int is_itanium_symbol = strncmp(mangled, "_Z", 2) == 0;
  if (is_itanium_symbol) {
    // Note: __cxa_demangle default is DMGL_PARAMS | DMGL_TYPES
    return cplus_demangle_v3(mangled, DMGL_PARAMS | DMGL_TYPES);
  }

  int is_rust_symbol = strncmp(mangled, "_R", 2) == 0;
  if (is_rust_symbol) {
    // Note: rust_demangle uses only DMGL_VERBOSE and DMGL_NO_RECURSE_LIMIT,
    // so no need to pass any options in our case.
    return rust_demangle(mangled, DMGL_NO_OPTS);
  }

  return NULL;
}

// Logic is inspired by llvm::demangle.
// It is the caller's responsibility to free the string which is returned.
char *demangle(const char *mangled) {
  char *demangled = non_microsoft_demangle(mangled);
  if (demangled) {
    return demangled;
  }

  if (mangled[0] == '_') {
    demangled = non_microsoft_demangle(&mangled[1]);
    if (demangled) {
      return demangled;
    }
  }

  return NULL;
}
