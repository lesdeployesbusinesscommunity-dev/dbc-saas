// Local Imports
import { publishAnnouncement } from "app/pages/Annonces/announcementsStore";
import { personKey } from "app/pages/Annonces/audience";
import { DEFAULT_SPONSOR } from "../Inscriptions/registrationsStore";
import { normalizeSearchText } from "../searchUtils";
import { listLeaders } from "../Inscriptions/registrationUtils";
import { addEntries, getEscalationLog, updateEntry } from "./escalationStore";
import { isStillTimely, penaltyOf, sharePerMember, stepsFor } from "./escalation";

// ----------------------------------------------------------------------
// Le moteur de la relance automatique. À partir de la liste des membres en
// retard (voir mockData.summarizeGroups), il déclenche pour chacun les étapes
// que son retard a atteintes et qui n'ont pas encore eu lieu (voir
// escalation.js pour les règles, escalationStore.js pour le journal) :
//   - reminder1 / reminder2 : message privé au membre dans l'application, et
//                  SMS + WhatsApp préparés ("queued") ;
//   - cm         : dossier confié au chef d'antenne du membre (le Community
//                  Manager Financier : voir followUpModel.js), qui en est prévenu
//                  par un message privé, contacte le membre et rend son rapport ;
//   - mentor     : message privé au mentor-parrain du membre ;
//   - caution    : message privé aux autres membres du groupe ;
//   - reserve    : tâche — activer le Fonds de Réserve et écrire le plan de
//                  remboursement (la dette entre dans ce journal, qui sert de
//                  piste d'audit) ;
//   - formal / governance : tâches de procédure formelle et de saisine du Comité.
// Il se relance à chaque ouverture de la page et ne fait rien de plus d'une fois
// pour la même étape : tant que le serveur n'est pas là pour le faire chaque jour,
// c'est la page qui joue ce rôle. Les SMS et WhatsApp ne partent pas encore : ils
// attendent le service d'envoi.

const author = (t) => ({ role: "admin", name: t("admin.tontine.reminders.sender"), matricule: "", branchName: "" });

function publishTo(t, title, body, recipients, names) {
  // Traductions pas encore chargées : t() renvoie la clé. On ne publie pas un
  // message illisible, la prochaine ouverture de la page le fera.
  if (/^[a-z][A-Za-z]*(\.[A-Za-z_0-9]+){2,}$/.test(title)) return;
  publishAnnouncement({
    kind: "reminder",
    title,
    body,
    importance: "important",
    author: author(t),
    audience: { type: "members", total: recipients.length, names },
    recipients,
  });
}

const norm = normalizeSearchText;

// Le chef d'antenne qui suit la ville d'un membre : on cherche la branche du
// réseau qui porte le nom de la ville, puis on remonte jusqu'au premier
// responsable en poste (jamais le Superviseur National : ce n'est pas un chef
// d'antenne). Renvoie la fiche du leader (voir registrationUtils.listLeaders) ou null.
export function findLeaderFor(networksByCountry, cityText) {
  const city = norm(String(cityText ?? "").split(",")[0]);
  if (!city) return null;
  const leaders = listLeaders(networksByCountry);
  let found = null;
  const visit = (node, leaderNode, country, depth) => {
    const current = depth > 0 && node.memberId ? node : leaderNode;
    if (current && norm(node.label) === city) found = { nodeId: current.id, country };
    (node.children ?? []).forEach((child) => visit(child, current, country, depth + 1));
  };
  Object.entries(networksByCountry).forEach(([country, root]) => root && visit(root, null, country, 0));
  if (!found) return null;
  return leaders.find((leader) => leader.nodeId === found.nodeId && leader.country === found.country) ?? null;
}

// Confie le dossier de relance d'un membre à un chef d'antenne et le prévient.
// "entry" : la ligne du journal de l'étape "cm" ; "info" : { name, group, days,
// amount } pour le message.
export function assignFollowUp(entry, leader, { t, members }, info) {
  const assignment = {
    leaderId: leader.leaderId,
    leaderName: leader.leaderName,
    nodeId: leader.nodeId,
    branchName: leader.branchName,
    location: leader.location,
    country: leader.country,
    assignedAt: new Date().toISOString(),
  };
  const person = members.find((item) => item.id === leader.leaderId);
  if (person?.matricule) {
    publishTo(
      t,
      t("admin.tontine.reminders.msg.cm.title", info),
      t("admin.tontine.reminders.msg.cm.body", info),
      [personKey({ matricule: person.matricule })],
      [leader.leaderName],
    );
  }
  return assignment;
}

export function runEscalation({ lateEntries, members, networks, today, t, money, day }) {
  const known = new Set(getEscalationLog().entries.map((entry) => entry.id));
  const created = [];

  const infoFor = (group, member) => ({
    name: member.name,
    group: `${t(`simulateur.levels.${group.levelKey}.name`)} · ${t("admin.tontine.group", { letter: group.letter })}`,
    amount: money(group.cotisation),
    days: member.daysLate,
  });

  // Les dossiers de relance ouverts avant que le chef d'antenne existe dans le
  // suivi (sans responsable) en reçoivent un dès qu'on en trouve un.
  lateEntries.forEach(({ group, member }) => {
    const open = getEscalationLog().entries.find(
      (entry) => entry.step === "cm" && entry.groupId === group.id && entry.memberId === member.id && !entry.assignment,
    );
    if (!open || open.status !== "todo") return;
    const leader = findLeaderFor(networks, member.city);
    if (leader) {
      updateEntry(open.id, { assignment: assignFollowUp(open, leader, { t, members }, infoFor(group, member)) });
    }
  });

  lateEntries.forEach(({ group, member }) => {
    const daysLate = member.daysLate;
    const occurrences = Math.max(1, member.missedCount ?? 1);
    const penalty = penaltyOf(daysLate, occurrences);
    if (!penalty) return;

    const cycleKey = `${group.id}|${today.format("YYYY-MM")}|${member.id}`;
    const penaltyAmount = Math.round(group.cotisation * penalty.rate);
    const groupLabel = t("admin.tontine.group", { letter: group.letter });
    const levelName = t(`simulateur.levels.${group.levelKey}.name`);
    const monthName = today.format("MM/YYYY");
    const deadline = day(group.dueDate.add(7, "day"));
    const vars = {
      name: member.name,
      group: `${levelName} · ${groupLabel}`,
      amount: money(group.cotisation),
      month: monthName,
      deadline,
      rate: Math.round(penalty.rate * 100),
      penalty: money(penaltyAmount),
      days: daysLate,
    };

    stepsFor(daysLate, occurrences).forEach(({ id, kind }) => {
      const entryId = `${cycleKey}|${id}`;
      if (known.has(entryId) || !isStillTimely(id, daysLate)) return;

      const entry = {
        id: entryId,
        cycleKey,
        step: id,
        memberId: member.id,
        memberName: member.name,
        groupId: group.id,
        levelKey: group.levelKey,
        letter: group.letter,
        daysLate,
        amount: group.cotisation,
        penaltyRate: penalty.rate,
        at: new Date().toISOString(),
        deliveries: [],
        recipients: 0,
        status: kind === "task" ? "todo" : "sent",
      };

      if (id === "reminder1" || id === "reminder2") {
        const key = id === "reminder1" ? "j1" : "j3";
        publishTo(
          t,
          t(`admin.tontine.reminders.msg.${key}.title`, vars),
          t(`admin.tontine.reminders.msg.${key}.body`, vars),
          [personKey({ name: member.name })],
          [member.name],
        );
        entry.deliveries = [
          { channel: "app", status: "sent" },
          { channel: "sms", status: "queued" },
          { channel: "whatsapp", status: "queued" },
        ];
        entry.recipients = 1;
      }

      if (id === "cm") {
        const leader = findLeaderFor(networks, member.city);
        if (leader) {
          entry.assignment = assignFollowUp(entry, leader, { t, members }, infoFor(group, member));
          entry.recipients = 1;
          entry.deliveries = [{ channel: "app", status: "sent" }];
        }
      }

      if (id === "mentor") {
        const person = members.find((item) => norm(item.name) === norm(member.name));
        const sponsorMatricule = person?.sponsorMatricule || DEFAULT_SPONSOR;
        const sponsor = members.find((item) => item.matricule === sponsorMatricule);
        publishTo(
          t,
          t("admin.tontine.reminders.msg.mentor.title", vars),
          t("admin.tontine.reminders.msg.mentor.body", { ...vars, sponsor: sponsor?.name ?? sponsorMatricule }),
          [personKey({ matricule: sponsorMatricule })],
          [sponsor?.name ?? sponsorMatricule],
        );
        entry.deliveries = [{ channel: "app", status: "sent" }];
        entry.recipients = 1;
        entry.note = sponsor?.name ?? sponsorMatricule;
      }

      if (id === "caution") {
        const others = group.members.filter((item) => item.id !== member.id);
        const share = money(sharePerMember(group.cotisation, group.size));
        publishTo(
          t,
          t("admin.tontine.reminders.msg.caution.title", vars),
          t("admin.tontine.reminders.msg.caution.body", { ...vars, share, count: others.length }),
          others.map((item) => personKey({ name: item.name })),
          others.map((item) => item.name),
        );
        entry.deliveries = [{ channel: "app", status: "sent" }];
        entry.recipients = others.length;
        entry.note = share;
      }

      created.push(entry);
    });
  });

  addEntries(created);
  return created.length;
}
