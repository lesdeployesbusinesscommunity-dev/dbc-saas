// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { publishAnnouncement } from "app/pages/Annonces/announcementsStore";
import { personKey } from "app/pages/Annonces/audience";
import { logMemberEvent } from "../Membres/membersStore";
import { RATING_REMINDER_HOURS, buildCandidates, ratingState } from "./priorityScore";
import { addRatingReminder, getPriorityState, lookupFor, requestRating } from "./priorityStore";

// ----------------------------------------------------------------------
// La demande de note au mentor-parrain, déclenchée d'office. Pour chaque membre
// d'un groupe qui a un parrain (champ « Parrain » de l'inscription) :
//   - la demande est créée une seule fois, le parrain reçoit un message privé et
//     la ligne est inscrite dans le journal du filleul ;
//   - le parrain a 72 h ; il est relancé automatiquement à 24 h, 48 h et 66 h
//     tant qu'il n'a pas rendu sa note.
// Sans serveur, ce moteur tourne à l'ouverture des pages de tontine (admin et
// membre) ; il ne fait rien de plus d'une fois pour la même étape.
const author = (t) => ({ role: "admin", name: t("tontinePriority.sender"), matricule: "", branchName: "" });

function send(t, sponsor, title, body) {
  publishAnnouncement({
    kind: "reminder",
    title,
    body,
    importance: "important",
    author: author(t),
    audience: { type: "members", total: 1, names: [sponsor.name] },
    recipients: [personKey({ matricule: sponsor.matricule })],
  });
}

export function runRatingEngine({ groups, people, t, day, now = Date.now() }) {
  groups.forEach((group) => {
    const candidates = buildCandidates({ group, people, lookup: lookupFor(getPriorityState()) });
    candidates.forEach((candidate) => {
      if (!candidate.recordId || !candidate.sponsorMatricule) return;
      const sponsorRecord = people.find((person) => person.matricule === candidate.sponsorMatricule);
      const sponsor = { matricule: candidate.sponsorMatricule, name: sponsorRecord?.name ?? candidate.sponsorName ?? candidate.sponsorMatricule };
      const person = { matricule: candidate.matricule, name: candidate.name };
      const groupLabel = `${t(`simulateur.levels.${group.levelKey}.name`)} · ${t("admin.tontine.group", { letter: group.letter })}`;
      const key = personKey(person);

      let record = getPriorityState().ratings[key];
      if (!record) {
        record = requestRating(person, sponsor);
        if (!record) return;
        send(
          t,
          sponsor,
          t("tontinePriority.rating.msg.request.title", { name: candidate.name }),
          t("tontinePriority.rating.msg.request.body", {
            name: candidate.name,
            group: groupLabel,
            date: `${day(dayjs(record.dueAt))} ${dayjs(record.dueAt).format("HH:mm")}`,
          }),
        );
        logMemberEvent(candidate.recordId, "priorityRatingRequested", { sponsorName: sponsor.name });
        return;
      }

      if (ratingState(record, now) !== "pending") return;
      const elapsedHours = (now - new Date(record.requestedAt).getTime()) / 3600000;
      const reached = RATING_REMINDER_HOURS.filter((hours) => hours <= elapsedHours).length;
      if (reached > record.reminders.length) {
        const left = Math.max(1, Math.ceil((new Date(record.dueAt).getTime() - now) / 3600000));
        send(
          t,
          sponsor,
          t("tontinePriority.rating.msg.reminder.title", { name: candidate.name }),
          t("tontinePriority.rating.msg.reminder.body", { name: candidate.name, hours: left }),
        );
        addRatingReminder(key);
      }
    });
  });
}
