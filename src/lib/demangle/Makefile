EMCC = emcc
CFLAGS = -Os -Igcc/include -DHAVE_STDLIB_H -DHAVE_STRING_H
LDFLAGS_COMMON = \
    -s EXPORTED_RUNTIME_METHODS=stringToUTF8OnStack,UTF8ToString \
    -s EXPORTED_FUNCTIONS=_demangle,_free \
    -s MODULARIZE=1 \
    -s WASM=1 \
    -s FILESYSTEM=0

# To use inside speedscope, we have to disable EXPORT_ES6 as otherwise
# jest complain because it doesn't support es6 module export. It doesn't happen
# with .ts because they are compiled to compatible js.
ifeq ($(TEST),1)
    LDFLAGS = $(LDFLAGS_COMMON) -s EXPORT_ES6=1
else
    LDFLAGS = $(LDFLAGS_COMMON) -s SINGLE_FILE=1 -s ENVIRONMENT=web
endif

SRC_FILES = \
    gcc/libiberty/safe-ctype.c \
    gcc/libiberty/rust-demangle.c \
    gcc/libiberty/cp-demangle.c \
    demangle.c
POST_JS = demangle.post.js
OUTPUT = demangle.wasm.js

all: $(OUTPUT)

$(OUTPUT): $(SRC_FILES) $(POST_JS)
	$(EMCC) $(CFLAGS) $(SRC_FILES) $(LDFLAGS) --post-js $(POST_JS) --no-entry -o $(OUTPUT)

clean:
	rm -f $(OUTPUT)

.PHONY: all clean
