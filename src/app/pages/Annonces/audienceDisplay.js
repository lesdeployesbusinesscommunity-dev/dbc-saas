// ----------------------------------------------------------------------
// Comment on DIT à qui s'adresse une annonce, dans la langue courante : le
// libellé de l'auteur (qui voit à qui il a écrit) et celui du membre (qui voit
// pourquoi il reçoit ce message). Ce qui est gardé dans l'annonce ne contient
// que des faits (type, niveaux, noms) : la phrase se compose ici, donc elle
// suit la langue de l'interface.

const KEY = "announcements.audience";

const levelName = (t, key) => t(`simulateur.levels.${key}.name`);
const groupName = (t, group) => `${levelName(t, group.levelKey)} · ${t("admin.tontine.group", { letter: group.letter })}`;

// Les "faits" à garder dans l'annonce pour une cible choisie dans le formulaire.
// "form" : { type, levelKeys, groupIds, leaderId, allLeaders, leaderIds, memberKeys }.
export function audienceFacts(form, context, resolved) {
  switch (form.type) {
    case "levels":
      return { type: "levels", levelKeys: form.levelKeys };
    case "groups":
      return {
        type: "groups",
        groups: context.groupOptions
          .filter((group) => form.groupIds.includes(group.id))
          .map(({ id, levelKey, letter }) => ({ id, levelKey, letter })),
      };
    case "antenne": {
      if (context.scope === "leader") return { type: "antenne", branchName: context.branchName };
      const antenne = context.antenneOptions.find((item) => item.leaderId === form.leaderId);
      return { type: "antenne", branchName: antenne?.branchName ?? "", leaderName: antenne?.leaderName ?? "" };
    }
    case "leaders":
      return {
        type: "leaders",
        all: form.allLeaders,
        names: form.allLeaders
          ? []
          : context.leaderOptions.filter((leader) => form.leaderIds.includes(leader.leaderId)).map((leader) => leader.leaderName),
      };
    case "members":
      return { type: "members", total: resolved.people.length, names: resolved.people.slice(0, 3).map((person) => person.name) };
    default:
      return { type: "all" };
  }
}

const join = (list, t, max = 3) =>
  list.length > max ? `${list.slice(0, max).join(", ")} ${t(`${KEY}.more`, { count: list.length - max })}` : list.join(", ");

// "Niveau Starter, Bâtisseur", "Antenne Centre"... : ce que l'auteur lit.
export function audienceLabel(audience, t) {
  switch (audience.type) {
    case "levels":
      return t(`${KEY}.label.levels`, { levels: join(audience.levelKeys.map((key) => levelName(t, key)), t), count: audience.levelKeys.length });
    case "groups":
      return t(`${KEY}.label.groups`, { groups: join(audience.groups.map((group) => groupName(t, group)), t), count: audience.groups.length });
    case "antenne":
      return t(`${KEY}.label.antenne`, { branch: audience.branchName || audience.leaderName || "" });
    case "leaders":
      return audience.all ? t(`${KEY}.label.leadersAll`) : t(`${KEY}.label.leaders`, { names: join(audience.names, t) });
    case "members":
      return audience.total === 1 ? audience.names[0] : t(`${KEY}.label.members`, { count: audience.total });
    default:
      return t(`${KEY}.label.all`);
  }
}

// "Pour votre niveau", "Pour vous"... : ce que le membre lit.
export function audienceForMember(audience, t) {
  if (audience.type === "members") {
    return audience.total === 1 ? t(`${KEY}.forMe.you`) : t(`${KEY}.forMe.members`);
  }
  return t(`${KEY}.forMe.${audience.type}`);
}
