ATOM_PACKAGES := $(shell find packages/atoms -name "package.json")
ATOMS_DIRS := $(foreach el, $(ATOM_PACKAGES), $(dir $(el)))

ATOM_ALL := $(shell find packages/atoms -name "atom.css")
ATOM_ALL_MIN := $(shell find packages/atoms -name "atom.min.css")
ATOM_RESULT_CSS := $(foreach el, $(ATOMS_DIRS), $(el)result.css)
ATOM_MODULES_CSS_JSON := $(foreach el, $(ATOMS_DIRS), $(el)module.css.json)
ATOM_MODULE_CSS := $(foreach el, $(ATOMS_DIRS), $(el)module.css)
ATOM_INDEX_D_TS := $(foreach el, $(ATOMS_DIRS), $(el)index.d.ts)

ALL_RESULTS := $(ATOM_ALL)\
  $(ATOM_ALL_MIN)\
  $(ATOM_RESULT_CSS)\
  $(ATOM_MODULE_CSS)\
  $(ATOM_MODULES_CSS_JSON)\
  $(ATOM_INDEX_D_TS)
ALL_SNAPS := $(foreach el, $(ALL_RESULTS), $(el).snap)

.PHONY: test update $(ALL_RESULTS) $(ALL_SNAPS)

$(ALL_RESULTS):
	diff $@.snap $@

$(ALL_SNAPS):
	cp $(subst .snap,,$@) $@

test: $(ALL_RESULTS)

update: $(ALL_SNAPS)
