# matRiks — attribution

The twenty-eight figure matrices in `lib/test/tests/` were generated with
[`matRiks`](https://cran.r-project.org/package=matRiks) v0.1.5, an R package for
building rule-based figural matrices and their distractor sets.

`matRiks` is used **offline, as an authoring tool**. It is not a dependency of
this site: nothing in `package.json` references it, nothing at runtime calls it,
and the only thing that crosses into the repo is the geometry it produced, which
`scripts/matriks/build-figures.mjs` maps into this codebase's own `FigElement`
shape.

It is MIT licensed, and MIT requires the copyright notice and permission notice
to travel with the material, so they are reproduced below.

---

```
YEAR: 2023
COPYRIGHT HOLDER: matRiks authors
```

MIT License

Copyright (c) 2023 matRiks authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Not used: IMak

`IMak` (GPL-3) generates figural analogies and was considered. It is **not**
used. Running a GPL-3 tool to produce data does not make the data derivative,
but the licence obligation is stronger than MIT's and figural analogies are not
an item type on either instrument here, so there was nothing to buy with it.
