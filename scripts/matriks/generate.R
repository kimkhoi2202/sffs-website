# Figure-matrix generation for the Official Smart Fella Test.
#
#   Rscript scripts/matriks/generate.R
#
# Writes scripts/matriks/matrices.json: for each spec, the nine grid cells and
# the eleven tagged responses matRiks produces, as flat geometry records.
#
# WHY A GENERATOR RATHER THAN HAND-AUTHORED GEOMETRY. matRiks CONSTRUCTS cell 9
# from the rules, so the answer key cannot be mistyped, and it refuses to emit a
# repetition distractor that would equal the key. That is principle P1 of
# docs/test-content/rule-taxonomy.md satisfied structurally rather than by care.
#
# matRiks 0.1.5, MIT (see LICENSE-matRiks.md next to this file). It runs OFFLINE
# as an authoring tool; nothing here is a runtime dependency of the site.
#
# THE RULE TOKENS WE CAN USE ARE A SUBSET OF ITS OWN. mat_apply accepts
# rotate / size / shape / lwd / lty / AND / OR / XOR / identity / shade /
# reflect. Of those, the site's FigElement can express rotate, size, shade and
# the logical operators (which change element VISIBILITY, which is a list of
# shapes getting shorter). It cannot express line style, line weight or
# reflection, and matRiks' `shape` rule permutes among its own compound
# silhouettes (s_lily, s_malta, s_ninja...) rather than among ours, so that one
# is out too. Specs below therefore only ever use: identity, shade, size,
# rotate, AND, XOR.
#
# The same reason rules out two distractor families: `difference` and `ic_inc`
# both introduce matRiks-native shapes (s_maxi, the X placeholder) that have no
# glyph here. The taxonomy's composition rule allows `Correct + WP + IC + (R or
# D)`, so every matrix ships the R variant, which is also the variant it
# recommends — left-perseveration is the commonest matrix error.

suppressMessages(library(matRiks))
suppressMessages(library(jsonlite))

# ---------------------------------------------------------------------------
# The specs. `glyphs` is a per-element relabelling applied downstream: matRiks
# reasons about attributes, not silhouettes, so renaming its `pentagon` to our
# `arrow` leaves the rule structure and the generated key untouched.
#
# `rot` is a whole-number multiplier on the rotation DELTA. matRiks steps
# rotation by 45 degrees; a multiplier of 2 turns that into quarter turns. It is
# an order-preserving relabelling of one attribute, so it changes what the item
# looks like and not what it tests.
# ---------------------------------------------------------------------------
specs <- list(
  # ---- Grade 3 (L9): one simultaneous rule --------------------------------
  list(id = "g3-m1", base = c("circle"),                     h = "shade",  v = "identity", glyphs = c("circle"),                          rot = 1),
  list(id = "g3-m2", base = c("square"),                     h = "identity", v = "shade",  glyphs = c("heart"),                           rot = 1),
  list(id = "g3-m3", base = c("triangle"),                   h = "size",   v = "identity", glyphs = c("star"),                            rot = 1),
  list(id = "g3-m4", base = c("square", "circle"),           h = "shade",  v = "identity", glyphs = c("square", "circle"),                rot = 1),
  list(id = "g3-m5", base = c("pentagon"),                   h = "identity", v = "size",   glyphs = c("arrow"),                           rot = 1),

  # ---- Grade 4 (L10): one to two rules, size joins ------------------------
  list(id = "g4-m1", base = c("square"),                     h = "size",   v = "identity", glyphs = c("diamond"),                         rot = 1),
  list(id = "g4-m2", base = c("circle"),                     h = "shade",  v = "size",     glyphs = c("teardrop"),                        rot = 1),
  list(id = "g4-m3", base = c("triangle", "circle"),         h = "size",   v = "shade",    glyphs = c("triangle", "circle"),              rot = 1),
  list(id = "g4-m4", base = c("pentagon"),                   h = "shade",  v = "size",     glyphs = c("cross"),                           rot = 1),
  # Two elements, not three: three glyphs side by side and a size rule leaves
  # each step about 20% apart, which is a perception test rather than a
  # reasoning one.
  list(id = "g4-m5", base = c("square", "circle"),           h = "size",   v = "shade",    glyphs = c("cross", "teardrop"),               rot = 1),

  # ---- Grade 5 (L11): two rules, rotation in quarter turns ----------------
  list(id = "g5-m1", base = c("triangle"),                   h = "rotate", v = "shade",    glyphs = c("triangle"),                        rot = 2),
  list(id = "g5-m2", base = c("pentagon"),                   h = "size",   v = "rotate",   glyphs = c("arrow"),                           rot = 2),
  list(id = "g5-m3", base = c("circle", "triangle"),         h = "rotate", v = "size",     glyphs = c("teardrop", "arrow"),               rot = 2),
  list(id = "g5-m4", base = c("square"),                     h = "shade",  v = "rotate",   glyphs = c("heart"),                           rot = 2),
  list(id = "g5-m5", base = c("triangle", "square"),         h = "rotate", v = "shade",    glyphs = c("triangle", "teardrop"),            rot = 2),

  # ---- Grade 6 (L12): two to three rules, rotation off the quarter turn ---
  list(id = "g6-m1", base = c("triangle"),                   h = "rotate", v = "size",     glyphs = c("teardrop"),                        rot = 1),
  list(id = "g6-m2", base = c("square"),                     h = c("shade", "size"), v = "rotate", glyphs = c("arrow"),                   rot = 2),
  list(id = "g6-m3", base = c("circle", "square"),           h = "rotate", v = c("shade", "size"), glyphs = c("teardrop", "heart"),       rot = 2),
  # TWO GLYPH CONSTRAINTS, BOTH LEARNED THE HARD WAY BY LOOKING AT A RENDER.
  #
  # Rotation-active specs only ever name a glyph with no rotational symmetry. A
  # square, cross, diamond or circle turned a quarter turn is the same picture,
  # so the rule is applied and invisible.
  #
  # Shade-active specs never name `crescent` or `lightning`. Both are thin
  # figures drawn with a heavy keyline, so the stroke covers nearly all of the
  # ink and filling the interior changes almost nothing on screen. A shade rule
  # on a crescent renders as nine identical outline crescents — the column rule
  # simply is not there. Neither the attribute check nor matRiks can see this;
  # only a render can.
  list(id = "g6-m4", base = c("pentagon"),                   h = "rotate", v = "shade",    glyphs = c("heart"),                           rot = 1),
  list(id = "g6-m5", base = c("triangle", "circle"),         h = c("size", "rotate"), v = "shade", glyphs = c("triangle", "arrow"),       rot = 2),

  # ---- Grades 7-8 (L13/14): three rules, or a logical operator ------------
  list(id = "g78-m1", base = c("square"),                    h = c("shade", "size"), v = "rotate", glyphs = c("heart"),                   rot = 2),
  list(id = "g78-m2", base = c("circle", "square", "triangle", "pentagon"), h = "XOR", v = "identity", glyphs = c("circle", "square", "triangle", "star"), rot = 1),
  list(id = "g78-m3", base = c("triangle", "circle"),        h = c("rotate", "size"), v = "shade", glyphs = c("arrow", "teardrop"),       rot = 1),
  list(id = "g78-m4", base = c("circle", "square", "triangle", "pentagon"), h = "AND", v = "identity", glyphs = c("heart", "cross", "diamond", "lightning"), rot = 1),
  list(id = "g78-m5", base = c("pentagon"),                  h = c("shade", "rotate"), v = "size", glyphs = c("teardrop"),                rot = 1),

  # ---- Adult: one two-rule, one three-rule, one logical -------------------
  # Not `circle` for the second element: a circle turned a quarter turn is the
  # same circle, so half the cell would sit out the rotation rule entirely.
  list(id = "a-m1", base = c("triangle", "circle"),          h = "rotate", v = "shade",    glyphs = c("arrow", "teardrop"),               rot = 2),
  list(id = "a-m2", base = c("square"),                      h = c("shade", "size"), v = "rotate", glyphs = c("teardrop"),                rot = 1),
  list(id = "a-m3", base = c("circle", "square", "triangle", "pentagon"), h = "XOR", v = "identity", glyphs = c("crescent", "diamond", "cross", "triangle"), rot = 1)
)

# ---------------------------------------------------------------------------

flatten_num <- function(x) as.numeric(unlist(x))

# One figure as a plain record. `shade` is normalised to a character vector with
# "none" for NA so it survives the JSON round trip; matRiks stores it as NULL,
# NA or one of white/grey/black.
fig_record <- function(f) {
  shades <- vapply(f$shade, function(s) {
    if (is.null(s) || length(s) == 0 || all(is.na(s))) "none" else as.character(s[[1]])
  }, character(1))
  list(
    shape = as.character(f$shape),
    size = flatten_num(f$size.x),
    rotation = flatten_num(f$rotation),
    shade = shades,
    visible = as.numeric(f$visible)
  )
}

out <- list()
warnings_seen <- list()

for (sp in specs) {
  parts <- lapply(sp$base, function(nm) get(nm)())
  base <- do.call(cof, parts)

  m <- mat_apply(base, hrules = sp$h, vrules = sp$v)

  caught <- character(0)
  responses <- withCallingHandlers(
    response_list(m),
    warning = function(w) {
      caught <<- c(caught, conditionMessage(w))
      invokeRestart("muffleWarning")
    }
  )

  cells <- lapply(1:9, function(i) fig_record(m[[i]]))
  resp <- lapply(names(responses), function(nm) fig_record(responses[[nm]]))
  names(resp) <- names(responses)

  out[[sp$id]] <- list(
    id = sp$id,
    hrules = sp$h,
    vrules = sp$v,
    glyphs = sp$glyphs,
    rot = sp$rot,
    base = fig_record(base),
    cells = cells,
    responses = resp,
    warnings = caught
  )
  warnings_seen[[sp$id]] <- caught
  cat(sprintf("%-8s h=[%s] v=[%s] %d warning(s)\n", sp$id,
              paste(sp$h, collapse=","), paste(sp$v, collapse=","), length(caught)))
}

path <- file.path("scripts", "matriks", "matrices.json")
write(toJSON(out, auto_unbox = TRUE, digits = 6, pretty = TRUE), path)
cat("\nwrote", path, "\n")
