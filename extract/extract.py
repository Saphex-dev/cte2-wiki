#!/usr/bin/env python3
"""Extract Craft to Exile 2 RPG data from a reference modpack instance.

Usage:
    python extract/extract.py --instance "<path to CtE2 instance>" --out data/

Each registry is read in two layers, in the order the game resolves them:

    1. the mod jars' built-in `data/<namespace>/<registry>/`
    2. the pack's own datapack, `config/openloader/data/cte_mns/data/...`

The datapack *overlays* the jars file by file -- it does not replace them.
Entries the pack never ships still resolve to the jar's copy in game, so
reading the datapack alone silently drops them.

Display names are merged from the mod's lang file and the pack's lang
overrides (later wins), then one normalized JSON file is emitted per
collection.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from registry_map import (  # noqa: E402
    REGISTRIES, TALENT_TREES, LANG_SOURCES, EXCLUDE_GROUPS, CLASS_PREFIX,
    jar_prefix,
)

# Minecraft legacy formatting codes and the Patchouli-style ampersand variant.
FORMAT_CODE = re.compile(r"[§&][0-9a-fk-orA-FK-OR]")
# Mine and Slash embeds value references like [calc:arrow_barrage] in descriptions.
CALC_REF = re.compile(r"\[calc:([a-z0-9_./]+)\]")

# Grid cells that mean "nothing here".
EMPTY_CELLS = {"", "E"}

# Each mod jar ships a plaintext dump of its *default* registry contents, one id
# per line. Some of those defaults are registered in Java and ship no JSON --
# `health`, `mana` and `armor` among them -- so the dumps are the only in-pack
# record that they exist.
DEV_HELPER = "modpack_dev_helper/"


def strip_codes(text: str) -> str:
    return FORMAT_CODE.sub("", text).strip()


def parse_json(raw: str):
    """Some pack files carry raw control characters; the game's parser tolerates them."""
    return json.loads(raw, strict=False)


def humanize(identifier: str) -> str:
    """Fallback display name for registries the pack never translated."""
    return identifier.replace("_", " ").strip().title()


def derive_id(payload: dict, id_field: str, relpath: str) -> str:
    for key in (id_field, "id", "guid", "identifier"):
        val = payload.get(key)
        if isinstance(val, str) and val:
            return val
    return Path(relpath).stem


# --------------------------------------------------------------------------
# layers
# --------------------------------------------------------------------------

class JarRegistries:
    """Index of every `data/<namespace>/<registry>/**.json` across the mods folder."""

    def __init__(self, instance: Path):
        self._zips: dict[str, zipfile.ZipFile] = {}
        self._members: dict[str, list[tuple[str, str]]] = defaultdict(list)
        self._dumps: dict[str, tuple[str, set]] = {}
        for jar in sorted((instance / "mods").glob("*.jar")):
            try:
                z = zipfile.ZipFile(jar)
            except (zipfile.BadZipFile, OSError) as exc:
                print("  ! unreadable jar %s: %s" % (jar.name, exc), file=sys.stderr)
                continue
            used = False
            for member in z.namelist():
                if member.endswith(".json"):
                    parts = member.split("/")
                    if len(parts) >= 4 and parts[0] == "data":
                        self._members["data/%s/%s/" % (parts[1], parts[2])].append(
                            (jar.name, member))
                        used = True
                elif DEV_HELPER in member and member.endswith(".txt"):
                    body = z.read(member).decode("utf8", errors="replace").splitlines()
                    # Two header lines: "These are all default registry entries..."
                    body = body[2:] if body[:1] and body[0].startswith("These are all") else body
                    ids = {line.strip() for line in body if line.strip()}
                    registry = member.rsplit("/", 1)[-1][:-4]
                    source, seen = self._dumps.get(registry, ("", set()))
                    self._dumps[registry] = (
                        source or "mods/%s!/%s" % (jar.name, member),
                        seen | ids,
                    )
                    used = True
            if used:
                self._zips[jar.name] = z
            else:
                z.close()

    def code_registry(self, registry: str) -> tuple:
        """(source, ids) the mod registers in Java. Some ship no JSON at all."""
        return self._dumps.get(registry, (None, set()))

    @property
    def jar_count(self) -> int:
        return len(self._zips)

    def files(self, prefix: str):
        """(jar name, member, relpath, text) for one registry, in jar-name order."""
        for jar_name, member in sorted(self._members.get(prefix, [])):
            raw = self._zips[jar_name].read(member).decode("utf8", errors="replace")
            yield jar_name, member, member[len(prefix):], raw

    def close(self):
        for z in self._zips.values():
            z.close()


def registry_layers(instance: Path, spec: dict, jars: JarRegistries):
    """Every candidate file for a registry: jar defaults first, pack overrides last.

    Yields (origin, source, relpath, payload). Later items win on id collision.
    """
    prefix = jar_prefix(spec["dir"])
    for jar_name, member, relpath, raw in jars.files(prefix):
        try:
            payload = parse_json(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            print("  ! unparseable %s!/%s: %s" % (jar_name, member, exc), file=sys.stderr)
            continue
        if isinstance(payload, dict):
            yield "mod", "mods/%s!/%s" % (jar_name, member), relpath, payload

    root = instance / spec["dir"]
    if root.is_dir():
        for path in sorted(root.rglob("*.json")):
            try:
                payload = parse_json(path.read_text(encoding="utf8"))
            except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                print("  ! unparseable %s: %s" % (path.relative_to(instance), exc), file=sys.stderr)
                continue
            if isinstance(payload, dict):
                yield ("pack", path.relative_to(instance).as_posix(),
                       path.relative_to(root).as_posix(), payload)


def extract_registry(instance: Path, spec: dict, lang: dict, jars: JarRegistries) -> dict:
    layers = list(registry_layers(instance, spec, jars))
    if not layers:
        return {"key": spec["key"], "entries": [], "hidden": 0, "code_only": 0,
                "excluded": 0, "missing": True}

    # Merge by id, in layer order. The registry is id-keyed in game, so an entry
    # the pack ships under a different subfolder still overrides the jar's.
    merged: dict[str, dict] = {}
    for origin, source, relpath, payload in layers:
        if spec.get("unwrap") and "data" in payload:
            serializer = payload.get("ser")
            payload = payload["data"]
            payload["_serializer"] = serializer

        eid = derive_id(payload, spec["id_field"], relpath)
        # Subfolders are meaningful: spells group by class, uniques by base
        # gear type, affixes by prefix/suffix/implicit, entities by match mode.
        rel = str(Path(relpath).parent.as_posix())
        group = None if rel == "." else CLASS_PREFIX.sub("", rel)

        record = {"origin": origin, "source": source, "group": group, "data": payload}
        prev = merged.get(eid)
        if prev is not None:
            if prev["origin"] == origin == "mod" and prev["source"] != source:
                print("  ! %s: %s defined by two jars (%s, %s)"
                      % (spec["key"], eid, prev["source"], source), file=sys.stderr)
            if origin == "pack" and prev["origin"] == "mod":
                record["base_source"] = prev["source"]
            elif "base_source" in prev:
                record["base_source"] = prev["base_source"]
        merged[eid] = record

    # Defaults the mod registers in code. Lowest precedence: only ids that no
    # JSON layer defined at all. Checked against `merged` rather than the
    # emitted entries so an id the pack deliberately hid stays hidden.
    dump_source, default_ids = jars.code_registry(spec["dir"].rsplit("/", 1)[-1])
    code_only = 0
    for eid in sorted(default_ids - set(merged)):
        merged[eid] = {"origin": "code", "source": dump_source, "group": None, "data": {}}
        code_only += 1

    entries = []
    hidden = 0
    excluded = 0
    for eid, record in merged.items():
        if record["data"].get("hide_from_wiki"):
            hidden += 1
            continue
        if record["group"] in EXCLUDE_GROUPS:
            excluded += 1
            continue

        entry = {
            "id": eid,
            "group": record["group"],
            "origin": record["origin"],
            "source": record["source"],
            "data": record["data"],
        }
        if "base_source" in record:
            entry["base_source"] = record["base_source"]

        name_tpl = spec.get("name_key")
        raw = lang.get(name_tpl.format(id=eid)) if name_tpl else None
        if raw:
            entry["name"] = strip_codes(raw)
            entry["name_source"] = "lang"
        else:
            entry["name"] = humanize(eid)
            entry["name_source"] = "derived"

        desc_tpl = spec.get("desc_key")
        if desc_tpl:
            raw = lang.get(desc_tpl.format(id=eid))
            if raw:
                entry["description"] = strip_codes(raw)
                entry["calc_refs"] = sorted(set(CALC_REF.findall(raw)))

        entries.append(entry)

    entries.sort(key=lambda e: (e["group"] or "", e["id"]))
    return {"key": spec["key"], "entries": entries, "code_only": code_only,
            "hidden": hidden, "excluded": excluded}


def load_lang(instance: Path) -> dict:
    """Merge lang sources in order; later sources override earlier ones."""
    merged = {}
    for archive, member in LANG_SOURCES:
        path = instance / archive
        if not path.exists():
            print("  ! lang source missing: %s" % archive, file=sys.stderr)
            continue
        with zipfile.ZipFile(path) as z:
            try:
                raw = z.read(member)
            except KeyError:
                print("  ! %s not in %s" % (member, archive), file=sys.stderr)
                continue
        merged.update(json.loads(raw))
    return merged


# --------------------------------------------------------------------------
# talent trees
# --------------------------------------------------------------------------

def extract_talent_trees(instance: Path, lang: dict, perk_ids: set,
                         jars: JarRegistries) -> tuple:
    """Trees encode a grid as a CSV string: rows split on newline, cells on comma.

    'E' marks the empty border and every cell that names a real perk is a node.
    Everything else is a layout glyph the tree renderer uses to draw the
    connecting lines -- the mod uses a whole alphabet of them, not a fixed few,
    so they are identified by *not* resolving against the perk registry rather
    than by an allowlist that silently rots when the pack adds one.
    """
    spec = {"dir": TALENT_TREES, "id_field": "identifier"}
    layers = list(registry_layers(instance, spec, jars))

    by_id = {}
    for _origin, _source, relpath, payload in layers:
        by_id[payload.get("identifier") or Path(relpath).stem] = payload

    trees = []
    unknown = defaultdict(int)
    for payload in by_id.values():
        rows = payload.pop("perks", "").split("\n")
        grid = [row.split(",") for row in rows]

        nodes = []
        markers = {}
        for y, row in enumerate(grid):
            for x, cell in enumerate(row):
                cell = cell.strip()
                if cell in EMPTY_CELLS:
                    continue
                if cell in perk_ids:
                    nodes.append({
                        "perk": cell,
                        "x": x,
                        "y": y,
                        "name": strip_codes(lang.get("mmorpg.talent." + cell, "")) or None,
                    })
                else:
                    markers.setdefault(cell, []).append([x, y])
                    unknown[cell] += 1

        tree = dict(payload)
        tree.update({
            "width": max(len(r) for r in grid),
            "height": len(grid),
            "nodes": nodes,
            "markers": markers,
        })
        trees.append(tree)

    trees.sort(key=lambda t: (t.get("order", 0), t.get("identifier", "")))
    return trees, unknown


# --------------------------------------------------------------------------
# dimension biomes -- the source of the per-dimension backdrop palette
# --------------------------------------------------------------------------

# Vanilla dimensions are registered in Java and ship no `data/minecraft/dimension/`
# file, but the game DOES ship a biome tag per dimension, which is the same
# membership list a dimension file would name. Three entries; each is verified
# present at extraction time and the run reports loudly if one is not.
VANILLA_DIMENSION_BIOME_TAG = {
    "overworld": "minecraft:is_overworld",
    "the_nether": "minecraft:is_nether",
    "the_end": "minecraft:is_end",
}

# Mods that own a dimension declare its biome membership one of two ways, in the
# order tried here. Blue Skies and Twilight Forest use custom chunk generators,
# so their dimension file names no biomes at all and the tag is the only record.
MOD_DIMENSION_TAG_PATTERNS = ("%(ns)s:%(path)s", "%(ns)s:in_%(path)s")


class WorldgenIndex:
    """Biome, dimension and dimension_type JSON across the mods folder AND the
    vanilla client jar.

    Deliberately separate from JarRegistries rather than folded into it. That
    class backs every existing collection, and adding the client jar to it would
    put `data/minecraft/**` into registry resolution for all of them. Nothing
    currently reads a vanilla namespace, so the output would not change today --
    but the extractor's contract is a byte-identical re-run, and that is not a
    guarantee worth risking for convenience.
    """

    WANTED = ("/worldgen/biome/", "/dimension/", "/dimension_type/",
              "/tags/worldgen/biome/")

    def __init__(self, instance: Path, client_jar: Path):
        self._zips: dict[str, zipfile.ZipFile] = {}
        # path -> [archive label], in load order. Tags MERGE across providers,
        # so this is a list and not a single winner.
        self._providers: dict[str, list[str]] = defaultdict(list)

        for jar in sorted((instance / "mods").glob("*.jar")) + [client_jar]:
            try:
                z = zipfile.ZipFile(jar)
            except (zipfile.BadZipFile, OSError) as exc:
                print("  ! unreadable jar %s: %s" % (jar.name, exc), file=sys.stderr)
                continue
            used = False
            for member in z.namelist():
                if (member.startswith("data/") and member.endswith(".json")
                        and any(w in member for w in self.WANTED)):
                    self._providers[member].append(jar.name)
                    used = True
            if used:
                self._zips[jar.name] = z
            else:
                z.close()

    def load_all(self, path: str) -> list:
        return [json.loads(self._zips[label].read(path))
                for label in self._providers.get(path, [])]

    def load_one(self, path: str):
        found = self.load_all(path)
        return found[0] if found else None

    def source_of(self, path: str) -> str | None:
        labels = self._providers.get(path)
        return "%s!/%s" % (labels[0], path) if labels else None

    def tag_biomes(self, tag: str, seen: set | None = None) -> list:
        """Every biome in a tag, following `#other:tag` references.

        Tags MERGE across datapacks -- `is_end` is provided by both the client
        jar and TheOuterEnd, and the dimension really does contain both sets.
        Reading only the first provider silently loses the rest, which is the
        same class of bug SOURCE_INVENTORY.md documents for registries.
        """
        seen = set() if seen is None else seen
        if tag in seen:
            return []
        seen.add(tag)
        namespace, _, path = tag.partition(":")
        values: list = []
        for payload in self.load_all(
                "data/%s/tags/worldgen/biome/%s.json" % (namespace, path)):
            if payload.get("replace"):
                values = []
            for entry in payload.get("values", []):
                entry = entry if isinstance(entry, str) else entry.get("id")
                if not entry:
                    continue
                if entry.startswith("#"):
                    values.extend(self.tag_biomes(entry[1:], seen))
                else:
                    values.append(entry)
        return values

    def close(self):
        for z in self._zips.values():
            z.close()


def default_client_jar(instance: Path):
    """`<curseforge>/minecraft/Install/versions/<mc>/<mc>.jar`, or the vanilla
    launcher's copy. Derived from the instance rather than configured, so the
    normal CurseForge layout needs no extra flag."""
    manifest_path = instance / "manifest.json"
    if not manifest_path.is_file():
        return None
    version = json.loads(manifest_path.read_text(encoding="utf8")).get(
        "minecraft", {}).get("version")
    if not version:
        return None
    for candidate in (
        instance.parent.parent / "Install" / "versions" / version / ("%s.jar" % version),
        Path.home() / "AppData/Roaming/.minecraft/versions" / version / ("%s.jar" % version),
        Path.home() / ".minecraft/versions" / version / ("%s.jar" % version),
    ):
        if candidate.is_file():
            return candidate
    return None


def extract_dimension_biomes(index: WorldgenIndex, dimension_ids) -> tuple:
    """Per dimension: whether it renders a sky, and every biome's sky and fog.

    This MIRRORS the pack and interprets nothing. Which of the two colours reads
    as the dimension, and how a list of them becomes one backdrop colour, is a
    display decision and lives in `src/lib/dimensions.ts` (ROADMAP D3).

    `has_skylight` is carried because it is the field that makes the two colours
    comparable at all: a dimension with no skylight never draws `sky_color`, so
    the Nether's is the vanilla blue and means nothing on screen.
    """
    out = []
    problems = []
    for dimension_id in sorted(dimension_ids):
        namespace, _, path = dimension_id.partition(":")

        biomes, source = [], None
        if namespace == "minecraft":
            tag = VANILLA_DIMENSION_BIOME_TAG.get(path)
            if tag:
                biomes = index.tag_biomes(tag)
                source = "tag %s" % tag
        else:
            dimension_file = "data/%s/dimension/%s.json" % (namespace, path)
            payload = index.load_one(dimension_file)
            listed = (payload or {}).get("generator", {}).get(
                "biome_source", {}).get("biomes")
            if listed:
                biomes = [b["biome"] if isinstance(b, dict) else b for b in listed]
                source = index.source_of(dimension_file)
            else:
                for pattern in MOD_DIMENSION_TAG_PATTERNS:
                    tag = pattern % {"ns": namespace, "path": path}
                    biomes = index.tag_biomes(tag)
                    if biomes:
                        source = "tag %s" % tag
                        break

        if not biomes:
            problems.append("%s: no biome list found" % dimension_id)
            continue

        # The dimension_type may be named by the dimension file rather than
        # sharing its path -- Twilight Forest's is `twilight_forest_type`.
        type_file = "data/%s/dimension_type/%s.json" % (namespace, path)
        dimension_type = index.load_one(type_file)
        if dimension_type is None:
            named = (index.load_one(
                "data/%s/dimension/%s.json" % (namespace, path)) or {}).get("type")
            if isinstance(named, str) and ":" in named:
                type_ns, _, type_path = named.partition(":")
                type_file = "data/%s/dimension_type/%s.json" % (type_ns, type_path)
                dimension_type = index.load_one(type_file)
        if dimension_type is None:
            problems.append("%s: no dimension_type" % dimension_id)
            continue

        rows = []
        for biome in sorted(set(biomes)):
            biome_ns, _, biome_path = biome.partition(":")
            payload = index.load_one(
                "data/%s/worldgen/biome/%s.json" % (biome_ns, biome_path))
            if payload is None:
                problems.append("%s: biome %s not found" % (dimension_id, biome))
                continue
            effects = payload.get("effects", {})
            rows.append({
                "id": biome,
                "sky_color": effects.get("sky_color"),
                "fog_color": effects.get("fog_color"),
            })

        out.append({
            "id": dimension_id,
            "source": source,
            "type_source": index.source_of(type_file),
            "data": {
                "has_skylight": bool(dimension_type.get("has_skylight")),
                "has_ceiling": bool(dimension_type.get("has_ceiling")),
                "biomes": rows,
            },
        })
    return out, problems


# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--instance", required=True, type=Path)
    ap.add_argument("--out", default=Path("data"), type=Path)
    # The vanilla jar is not inside the instance -- CurseForge keeps one shared
    # copy per Minecraft version. It is derived from the instance below; this
    # flag is for layouts the derivation does not know about.
    ap.add_argument("--client-jar", default=None, type=Path)
    args = ap.parse_args()

    instance = args.instance.resolve()
    if not (instance / "config/openloader/data/cte_mns").is_dir():
        print("error: no cte_mns datapack under %s" % instance, file=sys.stderr)
        return 1
    if not (instance / "mods").is_dir():
        print("error: no mods folder under %s" % instance, file=sys.stderr)
        return 1

    args.out.mkdir(parents=True, exist_ok=True)

    print("Indexing mod jars...")
    jars = JarRegistries(instance)
    print("  %d jars carry registry data" % jars.jar_count)

    print("Loading lang...")
    lang = load_lang(instance)
    print("  %d keys merged" % len(lang))

    index = []
    total = 0
    total_hidden = 0
    perk_ids: set = set()
    print("Extracting registries (jar defaults <- pack overrides)...")
    for spec in REGISTRIES:
        result = extract_registry(instance, spec, lang, jars)
        if result.get("missing"):
            print("  ! no files for %s" % spec["key"], file=sys.stderr)
            continue
        entries = result["entries"]
        named = sum(1 for e in entries if e.get("name_source") == "lang")
        from_mod = sum(1 for e in entries if e["origin"] == "mod")
        overridden = sum(1 for e in entries if "base_source" in e)
        if spec["key"] == "perks":
            perk_ids = {e["id"] for e in entries}

        out = args.out / ("%s.json" % spec["key"])
        out.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf8")
        from_code = sum(1 for e in entries if e["origin"] == "code")
        print("  %-22s %5d entries  %5d lang-named  %4d mod  %4d code  %4d overridden"
              "  %4d hidden  %4d excluded"
              % (spec["key"], len(entries), named, from_mod, from_code, overridden,
                 result["hidden"], result["excluded"]))
        index.append({"key": spec["key"], "count": len(entries), "lang_named": named,
                      "from_pack": len(entries) - from_mod - from_code,
                      "from_mod": from_mod, "from_code": from_code,
                      "overridden": overridden,
                      "hidden": result["hidden"], "excluded": result["excluded"],
                      "groups": sorted({e["group"] for e in entries if e["group"]})})
        total += len(entries)
        total_hidden += result["hidden"]

    trees, unknown = extract_talent_trees(instance, lang, perk_ids, jars)
    (args.out / "talent_trees.json").write_text(
        json.dumps(trees, indent=2, ensure_ascii=False), encoding="utf8")
    for t in trees:
        print("  tree:%-18s %5d nodes  %5d layout cells  %dx%d"
              % (t["identifier"], len(t["nodes"]),
                 sum(len(v) for v in t["markers"].values()), t["width"], t["height"]))
    if unknown:
        wide = sorted((c for c in unknown if len(c) > 2), key=lambda c: -unknown[c])
        if wide:
            print("  ! tree cells that look like perk ids but match no perk: %s"
                  % ", ".join("%s x%d" % (c, unknown[c]) for c in wide[:10]), file=sys.stderr)
    index.append({"key": "talent_trees", "count": len(trees),
                  "nodes": sum(len(t["nodes"]) for t in trees)})

    # Dimension biomes -- the raw material for the per-dimension backdrop
    # (ROADMAP D2/D15). Needs the vanilla client jar as well as the mods, since
    # three of the eight dimensions are Minecraft's own.
    client_jar = args.client_jar or default_client_jar(instance)
    if client_jar is None or not client_jar.is_file():
        print("error: vanilla client jar not found; pass --client-jar. Skipping it "
              "would make data/ depend on the machine, and the extractor "
              "guarantees a byte-identical re-run.", file=sys.stderr)
        jars.close()
        return 1
    print("Reading worldgen (mods + %s)..." % client_jar.name)
    worldgen = WorldgenIndex(instance, client_jar)
    dimension_ids = [e["id"] for e in json.loads(
        (args.out / "dimensions.json").read_text(encoding="utf8"))
        if e["id"] != "default"]
    dim_biomes, dim_problems = extract_dimension_biomes(worldgen, dimension_ids)
    worldgen.close()
    (args.out / "dimension_biomes.json").write_text(
        json.dumps(dim_biomes, indent=2, ensure_ascii=False), encoding="utf8")
    for entry in dim_biomes:
        rows = entry["data"]["biomes"]
        print("  dim:%-32s %3d biomes  skylight=%-5s  via %s"
              % (entry["id"], len(rows), entry["data"]["has_skylight"], entry["source"]))
    for problem in dim_problems:
        print("  ! %s" % problem, file=sys.stderr)
    index.append({"key": "dimension_biomes", "count": len(dim_biomes),
                  "biomes": sum(len(e["data"]["biomes"]) for e in dim_biomes),
                  "unresolved": len(dim_problems)})

    jars.close()

    manifest = json.loads((instance / "manifest.json").read_text(encoding="utf8"))
    (args.out / "_index.json").write_text(json.dumps({
        "pack": manifest.get("name"),
        "pack_version": manifest.get("version"),
        "minecraft": manifest.get("minecraft", {}).get("version"),
        "mod_count": len(manifest.get("files", [])),
        "collections": index,
    }, indent=2), encoding="utf8")

    print("\n%d entries across %d collections (%d hidden by hide_from_wiki)"
          % (total, len(index) - 1, total_hidden))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
