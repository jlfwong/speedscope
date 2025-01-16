EMCC = emcc
CFLAGS = -Os -Igcc/include -DHAVE_STDLIB_H -DHAVE_STRING_H
LDFLAGS_COMMON = \
    -s EXPORTED_RUNTIME_METHODS=stringToUTF8OnStack,UTF8ToString \
    -s EXPORTED_FUNCTIONS=_demangle,_free \
    -s MODULARIZE=1 \
    -s WASM=1 \
    -s FILESYSTEM=0 \
    -s MINIMAL_RUNTIME=1

# We have to disable EXPORT_ES6 as otherwise since esbuild cannot transpile that
# into umd or anything else. 
# .ts files throughout the project can do this just fine because they are
# transpiled to compatible js.
ifeq ($(TEST),1)
    LDFLAGS = $(LDFLAGS_COMMON) -s EXPORT_ES6=1
else
    # SINGLE_FILE=1 embeds the wasm as base64.
    LDFLAGS = $(LDFLAGS_COMMON) -s ASSERTIONS=0 -s SINGLE_FILE=1 -s ENVIRONMENT=web
endif

SRC_FILES = \
    gcc/libiberty/safe-ctype.c \
    gcc/libiberty/rust-demangle.c \
    gcc/libiberty/cp-demangle.c \
    demangle.c
POST_JS = demangle.post.js
EXTERN_POST_JS = demangle.extern.post.js
OUTPUT = demangle.wasm.js

all: $(OUTPUT)

$(OUTPUT): $(SRC_FILES) $(POST_JS)
	$(EMCC) $(CFLAGS) $(SRC_FILES) $(LDFLAGS) --post-js $(POST_JS) --extern-post-js $(EXTERN_POST_JS) --no-entry -o $@

clean:
	rm -f $(OUTPUT)

.PHONY: all clean
