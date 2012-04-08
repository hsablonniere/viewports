DIST_DIR = dist
LIB_DIR = lib
SRC_DIR = src

SCRIPTS_DIR = scripts
STYLES_DIR = styles

# MEJL : Mother Effing JavaScript Loader : https://gist.github.com/2338480
MEJL_BEGIN = '(function(a,b,c,d){with(document)for(d=0;a[d];)c=body.appendChild(createElement("script")),c.async=b,c.type="text/javascript",c.src=a[d++]})(['
MEJL_END = '],false)'

INDEX_JS = ${SCRIPTS_DIR}/${DIST_DIR}/index.js
INDEX_JS_FILES = ${SCRIPTS_DIR}/${LIB_DIR}/PubSubJS.min.js\
	${SCRIPTS_DIR}/${LIB_DIR}/ICanHaz.min.js\
	${SCRIPTS_DIR}/${SRC_DIR}/helpers.js\
	${SCRIPTS_DIR}/${SRC_DIR}/core.js\
	${SCRIPTS_DIR}/${SRC_DIR}/prototypes.js\
	${SCRIPTS_DIR}/${SRC_DIR}/memory.js\
	${SCRIPTS_DIR}/${SRC_DIR}/orientation.js\
	${SCRIPTS_DIR}/${SRC_DIR}/list.js\
	${SCRIPTS_DIR}/${SRC_DIR}/list.jsonp.js\
	${SCRIPTS_DIR}/${SRC_DIR}/iframe.js\
	${SCRIPTS_DIR}/${SRC_DIR}/inputs.js\
	${SCRIPTS_DIR}/${SRC_DIR}/cursors.js\
	${SCRIPTS_DIR}/${SRC_DIR}/hash.js\
	${SCRIPTS_DIR}/${SRC_DIR}/title.js\
	${SCRIPTS_DIR}/${SRC_DIR}/keyboard.js\
	${SCRIPTS_DIR}/${SRC_DIR}/display.js\
	${SCRIPTS_DIR}/${SRC_DIR}/bookmarklets.js\
	${SCRIPTS_DIR}/${SRC_DIR}/resize.js

dev:
	@echo
	@echo ---------------------------------
	@echo Building styles for dev mode
	@echo ---------------------------------
	@echo
	@compass compile --force
	@echo
	@echo ---------------------------------
	@echo Building ${INDEX_JS} for dev mode
	@echo ---------------------------------
	@echo
	@echo ${MEJL_BEGIN} > ${INDEX_JS}
	@for file in ${INDEX_JS_FILES} ; do \
		echo Adding $$file; \
		echo '"'$$file'",' >> ${INDEX_JS} ; \
	done
	@echo ${MEJL_END} >> ${INDEX_JS}

prod:
	@echo
	@echo ---------------------------------
	@echo Building styles for prod mode
	@echo ---------------------------------
	@echo
	@compass compile --output-style compressed --force
	@echo
	@echo ---------------------------------
	@echo Building ${INDEX_JS} for prod mode
	@echo ---------------------------------
	@echo
	@rm ${INDEX_JS}
	@touch ${INDEX_JS}
	@for file in ${INDEX_JS_FILES} ; do \
		echo Minifying $$file; \
		uglifyjs -nc $$file >> ${INDEX_JS} ; \
	done

clean:
	@echo
	@echo ---------------------------------
	@echo Cleaning project
	@echo ---------------------------------
	@echo
	@rm -rf ${SCRIPTS_DIR/${DIST_DIR}
	@rm -rf ${STYLES_DIR/${DIST_DIR}
