"""Declarative map of Mine and Slash / Library of Exile registries -> wiki collections.

`dir`        : the registry under the pack datapack. The same registry inside a
               mod jar is `data/<namespace>/<registry>/` -- see `jar_prefix`.
`id_field`   : which JSON key holds the entry id (the mod is inconsistent).
`name_key`   : lang key template for the display name.
`desc_key`   : lang key template for the description, if any.
`unwrap`     : registries that wrap payload as {"data": {...}, "ser": "..."}.
"""

# The pack ships its own datapack, which *overlays* each mod's built-in registry
# file by file. Entries the pack does not ship still resolve to the mod jar's
# copy at runtime, so both layers have to be read: jar first, datapack on top.
DATAPACK_ROOT = "config/openloader/data/cte_mns/data"

MMORPG = f"{DATAPACK_ROOT}/mmorpg"
LOE = f"{DATAPACK_ROOT}/library_of_exile"
DUNGEON = f"{DATAPACK_ROOT}/dungeon_realm"

REGISTRIES = [
    # --- core RPG (v1 scope) ---
    dict(key="stats",         dir=f"{MMORPG}/mmorpg_stat",            id_field="id",
         name_key="mmorpg.stat.{id}",        desc_key="mmorpg.stat_desc.{id}", unwrap=True),
    dict(key="affixes",       dir=f"{MMORPG}/mmorpg_affixes",         id_field="guid",
         name_key="mmorpg.affix.{id}"),
    dict(key="uniques",       dir=f"{MMORPG}/mmorpg_unique_gears",    id_field="guid",
         name_key="mmorpg.unique_gear.{id}.name"),
    dict(key="spells",        dir=f"{MMORPG}/mmorpg_spells",          id_field="identifier",
         name_key="mmorpg.spell.{id}",       desc_key="spell.desc.{id}"),
    dict(key="perks",         dir=f"{MMORPG}/mmorpg_perk",            id_field="id",
         name_key="mmorpg.talent.{id}"),
    dict(key="gems",          dir=f"{MMORPG}/mmorpg_gems",            id_field="identifier"),
    dict(key="support_gems",  dir=f"{MMORPG}/mmorpg_support_gem",     id_field="id",
         name_key="mmorpg.support_gem.{id}"),
    dict(key="base_gear",     dir=f"{MMORPG}/mmorpg_base_gear_types", id_field="guid",
         name_key="mmorpg.gear_type.{id}"),
    dict(key="runewords",     dir=f"{MMORPG}/mmorpg_runeword",        id_field="id",
         name_key="mmorpg.runeword.{id}"),
    dict(key="runes",         dir=f"{MMORPG}/mmorpg_runes",           id_field="id"),
    dict(key="auras",         dir=f"{MMORPG}/mmorpg_aura",            id_field="id",
         name_key="mmorpg.aura.{id}"),
    dict(key="exile_effects", dir=f"{MMORPG}/mmorpg_exile_effect",    id_field="id",
         name_key="mmorpg.effect.{id}"),
    dict(key="gear_slots",    dir=f"{MMORPG}/mmorpg_gear_slot",       id_field="id",
         name_key="mmorpg.gearslot.{id}"),
    dict(key="spell_schools", dir=f"{MMORPG}/mmorpg_spell_school",    id_field="id"),
    dict(key="weapon_types",  dir=f"{MMORPG}/mmorpg_weapon_type",     id_field="id"),
    dict(key="value_calcs",   dir=f"{MMORPG}/mmorpg_value_calc",      id_field="id"),

    # --- endgame / atlas ---
    dict(key="map_affixes",   dir=f"{MMORPG}/mmorpg_map_affix",       id_field="id"),
    dict(key="mob_affixes",   dir=f"{MMORPG}/mmorpg_mob_affix",       id_field="id",
         name_key="mmorpg.mob_affix.{id}"),
    dict(key="mob_rarities",  dir=f"{MMORPG}/mmorpg_mob_rarity",      id_field="id",
         name_key="mmorpg.mob_rarity.{id}"),
    dict(key="prophecies",    dir=f"{MMORPG}/mmorpg_prophecy_modifier", id_field="id"),
    dict(key="omens",         dir=f"{MMORPG}/mmorpg_omen",            id_field="id",
         name_key="item.mmorpg.currency.{id}"),
    dict(key="shrine_buffs",  dir=f"{MMORPG}/mmorpg_shrine_buff",     id_field="id"),

    # --- professions ---
    dict(key="professions",   dir=f"{MMORPG}/mmorpg_profession",      id_field="id",
         name_key="mmorpg.profession.{id}"),
    dict(key="profession_recipes", dir=f"{MMORPG}/mmorpg_profession_recipe", id_field="id"),

    # --- mobs ---
    dict(key="entities",      dir=f"{MMORPG}/mmorpg_entity",          id_field="id"),

    # --- library of exile ---
    dict(key="currency",      dir=f"{LOE}/library_of_exile_currency", id_field="id",
         name_key="item.mmorpg.currency.{id}"),
    dict(key="item_modifications", dir=f"{LOE}/library_of_exile_item_modification", id_field="id",
         name_key="library_of_exile.item_modification.{id}"),
    dict(key="relic_affixes", dir=f"{LOE}/library_of_exile_relic_affix", id_field="id"),
    dict(key="relic_stats",   dir=f"{LOE}/library_of_exile_relic_stat", id_field="id",
         name_key="library_of_exile.relic_stat.{id}"),
    dict(key="relic_types",   dir=f"{LOE}/library_of_exile_relic_type", id_field="id"),
    dict(key="relic_rarities", dir=f"{LOE}/library_of_exile_relic_rarity", id_field="id"),
    dict(key="mob_lists",     dir=f"{LOE}/library_of_exile_mob_list", id_field="id"),

    # --- dungeon realm / atlas ---
    dict(key="dungeons",      dir=f"{DUNGEON}/dungeon_realm_dungeon", id_field="id"),
    dict(key="atlas_nodes",   dir=f"{DUNGEON}/dungeon_realm_atlas_node", id_field="id"),
    dict(key="boss_arenas",   dir=f"{DUNGEON}/dungeon_realm_boss_arena", id_field="id"),
    dict(key="uber_bosses",   dir=f"{DUNGEON}/dungeon_realm_uber_boss", id_field="id",
         name_key="dungeon_realm.uber_boss.{id}"),
]

TALENT_TREES = f"{MMORPG}/mmorpg_talent_tree"


def jar_prefix(registry_dir: str) -> str:
    """Datapack dir -> the matching `data/<namespace>/<registry>/` prefix in a mod jar."""
    if not registry_dir.startswith(DATAPACK_ROOT + "/"):
        raise ValueError("registry dir outside the datapack root: %s" % registry_dir)
    return "data/%s/" % registry_dir[len(DATAPACK_ROOT) + 1:]


# Lang sources, applied in order (later wins).
LANG_SOURCES = [
    ("mods/Mine_and_Slash-1.20.1-6.4.7.jar", "assets/mmorpg/lang/en_us.json"),
    ("config/openloader/resources/resources.zip", "assets/mmorpg/lang/en_us.json"),
]


# Group folders that hold deprecated or internal content.
EXCLUDE_GROUPS = {"temp_unused", "obsolete", "disabled", "deprecated"}

# Spell class folders are prefixed with an ordering key (0_1_brawler).
CLASS_PREFIX = __import__("re").compile(r"^\d+_\d+_")
