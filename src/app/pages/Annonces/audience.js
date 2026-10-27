// Import Dependencies
import { normalizeSearchText } from "app/pages/Admin/searchUtils";

// Local Imports
import { getMember } from "app/pages/Admin/Reseau/mockData";
import { buildAntenneRoster } from "app/pages/Membre/Leader/leaderAccess";

// ----------------------------------------------------------------------
// À QUI s'adresse une annonce. Chaque personne est repérée par une "clé" : son
// matricule quand elle en a un, sinon son nom (certains membres des groupes de
// tontine de démonstration n'ont pas encore de fiche). Une annonce garde la
// liste des clés des personnes visées au moment de l'envoi (voir
// announcementsStore.js) ; un membre la voit si l'une de ses clés y figure.
//
// Types de cible :
//   "all"      tous les membres (administration seulement) ;
//   "levels"   les membres d'un ou plusieurs niveaux ;
//   "groups"   les membres d'un ou plusieurs groupes de tontine (administration) ;
//   "antenne"  les membres d'une antenne (le leader, lui, n'a que la sienne) ;
//   "leaders"  les leaders d'antenne, tous ou certains (administration) ;
//   "members"  des membres choisis un par un — une seule personne, ou plusieurs.
// Un leader n'écrit qu'à SON antenne : "antenne", "levels" et "members" y sont
// limités aux membres de son antenne.

const norm = normalizeSearchText;

export const personKey = ({ matricule, name }) => {
  if (matricule) return String(matricule).trim().toUpperCase();
  return name ? `name:${norm(name)}` : "";
};

// Les clés sous lesquelles le membre connecté peut être visé.
export function myKeys(member) {
  return new Set([personKey({ matricule: member.matricule }), personKey({ name: member.name })].filter(Boolean));
}

export function isForMe(announcement, member) {
  if (announcement.recipients === "all") return true;
  const mine = myKeys(member);
  return announcement.recipients.some((key) => mine.has(key));
}

const byName = (a, b) => a.name.localeCompare(b.name);

// L'annuaire : toutes les personnes connues (membres de la liste, plus les
// membres des groupes de tontine qui n'y figurent pas) avec leurs niveaux, et
// les membres de chaque groupe.
export function buildDirectory({ members, groups }) {
  const people = new Map();
  const nameToKey = new Map();

  members
    .filter((member) => member.status !== "desactive")
    .forEach((member) => {
      const key = personKey(member);
      if (!key) return;
      const existing = people.get(key);
      if (existing) {
        if (member.levelKey) existing.levelKeys.add(member.levelKey);
      } else {
        people.set(key, {
          key,
          name: member.name,
          matricule: member.matricule ?? "",
          city: member.city ?? "",
          levelKeys: new Set(member.levelKey ? [member.levelKey] : []),
        });
      }
      nameToKey.set(norm(member.name), key);
    });

  const groupMembers = new Map();
  groups.forEach((group) => {
    const keys = new Set();
    group.members.forEach((member) => {
      const key = nameToKey.get(norm(member.name)) ?? personKey({ name: member.name });
      if (!people.has(key)) {
        people.set(key, { key, name: member.name, matricule: "", city: member.city ?? "", levelKeys: new Set() });
      }
      people.get(key).levelKeys.add(group.levelKey);
      keys.add(key);
    });
    groupMembers.set(group.id, keys);
  });

  return { people, groupMembers, nameToKey };
}

// Compte les membres par niveau.
function levelOptionsOf(list, levelKeys) {
  return levelKeys
    .map((key) => ({ key, count: list.filter((person) => person.levelKeys.has(key)).length }))
    .filter((option) => option.count > 0);
}

// Le contexte de l'ADMINISTRATION : toutes les cibles possibles. "leaders" :
// la liste du réseau (voir Inscriptions/registrationUtils.js : listLeaders).
export function makeAdminAudience({ members, groups, leaders, levelKeys, author }) {
  const dir = buildDirectory({ members, groups });
  const everyone = [...dir.people.values()].sort(byName);

  // Les villes couvertes par l'antenne d'un leader : celle de la branche et la
  // sienne, faute de liste de villes dans le réseau.
  const rosterOf = (leader) => {
    const cities = [...new Set([leader.location, getMember(leader.leaderId)?.city].filter(Boolean))];
    return buildAntenneRoster({ memberId: leader.leaderId, cities }, members, groups).map((entry) => {
      const key = entry.matricule ? personKey(entry) : (dir.nameToKey.get(norm(entry.name)) ?? personKey(entry));
      return dir.people.get(key) ?? { key, name: entry.name, matricule: entry.matricule ?? "", city: entry.city ?? "", levelKeys: new Set() };
    });
  };

  const antennes = leaders
    .filter((leader) => !leader.isNational)
    .map((leader) => ({ ...leader, roster: rosterOf(leader) }));

  const leaderPerson = (leader) => {
    const member = getMember(leader.leaderId);
    return {
      key: personKey({ matricule: member?.matricule, name: leader.leaderName }),
      name: leader.leaderName,
      matricule: member?.matricule ?? "",
      city: member?.city ?? "",
      levelKeys: new Set(),
    };
  };

  return {
    scope: "admin",
    author,
    types: ["all", "levels", "groups", "antenne", "leaders", "members"],
    people: everyone,
    levelOptions: levelOptionsOf(everyone, levelKeys),
    groupOptions: groups
      .filter((group) => group.members.length > 0)
      .map((group) => ({ id: group.id, levelKey: group.levelKey, letter: group.letter, count: group.members.length })),
    antenneOptions: antennes.map((antenne) => ({
      leaderId: antenne.leaderId,
      leaderName: antenne.leaderName,
      branchName: antenne.branchName,
      country: antenne.country,
      count: antenne.roster.length,
    })),
    leaderOptions: leaders.map((leader) => ({
      leaderId: leader.leaderId,
      leaderName: leader.leaderName,
      branchName: leader.branchName,
      country: leader.country,
      isNational: leader.isNational,
    })),
    resolve(audience) {
      switch (audience.type) {
        case "all":
          return { all: true, people: everyone };
        case "levels":
          return { all: false, people: everyone.filter((p) => audience.levelKeys.some((key) => p.levelKeys.has(key))) };
        case "groups": {
          const keys = new Set(audience.groupIds.flatMap((id) => [...(dir.groupMembers.get(id) ?? [])]));
          return { all: false, people: everyone.filter((p) => keys.has(p.key)) };
        }
        case "antenne": {
          const antenne = antennes.find((item) => item.leaderId === audience.leaderId);
          return { all: false, people: [...(antenne?.roster ?? [])].sort(byName) };
        }
        case "leaders": {
          const chosen = audience.all
            ? leaders.filter((leader) => !leader.isNational)
            : leaders.filter((leader) => audience.leaderIds.includes(leader.leaderId));
          return { all: false, people: chosen.map(leaderPerson).sort(byName) };
        }
        case "members":
          return { all: false, people: audience.memberKeys.map((key) => dir.people.get(key)).filter(Boolean).sort(byName) };
        default:
          return { all: false, people: [] };
      }
    },
  };
}

// Le contexte d'un LEADER D'ANTENNE : seulement les membres de son antenne
// ("roster" : voir Membre/Leader/leaderAccess.js).
export function makeLeaderAudience({ roster, leader, levelKeys, author }) {
  const people = roster
    .map((entry) => ({
      key: personKey({ matricule: entry.matricule, name: entry.name }),
      name: entry.name,
      matricule: entry.matricule ?? "",
      city: entry.city ?? "",
      levelKeys: new Set(entry.levelKey ? [entry.levelKey] : []),
    }))
    .filter((person) => person.key)
    .sort(byName);

  return {
    scope: "leader",
    author,
    types: ["antenne", "levels", "members"],
    people,
    levelOptions: levelOptionsOf(people, levelKeys),
    groupOptions: [],
    antenneOptions: [],
    leaderOptions: [],
    branchName: leader?.branchName ?? "",
    resolve(audience) {
      switch (audience.type) {
        case "antenne":
          return { all: false, people };
        case "levels":
          return { all: false, people: people.filter((p) => audience.levelKeys.some((key) => p.levelKeys.has(key))) };
        case "members":
          return { all: false, people: people.filter((p) => audience.memberKeys.includes(p.key)) };
        default:
          return { all: false, people: [] };
      }
    },
  };
}
